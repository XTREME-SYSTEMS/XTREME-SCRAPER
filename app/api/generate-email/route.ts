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
    const { lead, template, tone } = await req.json();
    const name = lead?.name || 'Business';
    const phone = lead?.phone || '';
    const address = lead?.address || 'your area';

    const prompt = `Write a ${tone || 'professional'} B2B cold outreach email for this lead.

Business: ${name}
Location: ${address}
Phone: ${phone}
Template style: ${template || 'Cold Intro'}

Format exactly as:
SUBJECT: [subject]
BODY:
[body - 3-4 paragraphs, personalized, no filler phrases]`;

    try {
      const aiText = await callBase44AI(prompt);
      const subjectMatch = aiText.match(/SUBJECT:\s*(.+)/i);
      const bodyMatch = aiText.match(/BODY:\s*([\s\S]+)/i);
      return NextResponse.json({
        subject: subjectMatch ? subjectMatch[1].trim() : `Reaching out to ${name}`,
        body: bodyMatch ? bodyMatch[1].trim() : aiText
      });
    } catch {
      return NextResponse.json({
        subject: `Quick question about ${name}`,
        body: `Hi ${name} Team,\n\nI came across your business in ${address} and wanted to reach out directly.\n\nWe help local businesses like yours connect with high-intent commercial clients in your area. No upfront cost — we only send you verified inquiries.\n\nWould a quick 5-minute call work this week?\n\nBest,\n[Your Name]`
      });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Email generation failed' }, { status: 500 });
  }
}
