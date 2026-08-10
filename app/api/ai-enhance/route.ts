import { NextRequest, NextResponse } from 'next/server';

const BASE44_API_KEY = process.env.BASE44_API_KEY;
const BASE44_AGENT_ID = process.env.BASE44_AGENT_ID || '6a4ae522852a5e08bfa42450';

async function callBase44AI(prompt: string): Promise<string> {
  if (!BASE44_API_KEY) throw new Error('No Base44 API key');
  const res = await fetch(`https://api.base44.com/api/apps/${BASE44_AGENT_ID}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': BASE44_API_KEY },
    body: JSON.stringify({ message: prompt }),
  });
  if (!res.ok) throw new Error(`Base44 error: ${res.status}`);
  const data = await res.json();
  return data?.message?.content || data?.content || data?.response || data?.text || '';
}

export async function POST(req: NextRequest) {
  try {
    const { query, city, state } = await req.json();

    const prompt = `You are an expert B2B lead generation specialist. A user is searching for business leads.

Search query: "${query}"
Location: ${city || 'Unknown'}, ${state || 'Unknown'}

Generate 5 alternative search keyword variations that would help find more relevant businesses. Each should be a specific industry term or variation that someone would search.

Return ONLY a JSON array of 5 strings, nothing else. Example: ["term 1", "term 2", "term 3", "term 4", "term 5"]`;

    try {
      const aiText = await callBase44AI(prompt);
      const match = aiText.match(/\[[\s\S]*?\]/);
      if (match) {
        const suggestions = JSON.parse(match[0]);
        return NextResponse.json({ suggestions: suggestions.slice(0, 5) });
      }
    } catch { /* fall through to fallback */ }

    // Fallback
    const base = query.toLowerCase();
    return NextResponse.json({
      suggestions: [
        `${base} near me`,
        `commercial ${base}`,
        `professional ${base}`,
        `${base} company`,
        `local ${base} services`,
      ]
    });
  } catch (err) {
    return NextResponse.json({ error: 'AI enhance failed' }, { status: 500 });
  }
}
