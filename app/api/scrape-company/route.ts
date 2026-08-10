import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  try {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    const res = await fetch(cleanUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 4000);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

    const hostname = new URL(cleanUrl).hostname.replace('www.', '');
    const companyName = titleMatch?.[1]?.split(/[|\-–]/)[0]?.trim() || hostname;
    const description = descMatch?.[1] || ogDescMatch?.[1] || '';

    let intel: Record<string, unknown> = {
      companyName,
      tagline: description,
      services: [] as string[],
      highlights: [] as string[],
      targetAudience: 'businesses',
      tone: 'Professional',
      highlight: description ? description.substring(0, 100) : `${companyName}'s professional services`,
      url: cleanUrl,
    };

    if (process.env.OPENAI_API_KEY) {
      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Extract company intelligence from website content. Return JSON: {companyName, tagline, services (array of strings), highlights (3-5 bullet strings), targetAudience, tone (Formal/Casual/Technical), highlight (1 impressive sentence about the company)}',
              },
              { role: 'user', content: `Company: ${companyName}\nDescription: ${description}\n\nWebsite text:\n${text}` },
            ],
            max_tokens: 500,
            response_format: { type: 'json_object' },
          }),
        });
        const aiData = await aiRes.json();
        const extracted = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
        intel = { ...intel, ...extracted, url: cleanUrl };
      } catch { /* fall back to basic extraction */ }
    } else {
      // Basic keyword extraction without AI
      const serviceKeywords = ['flooring', 'epoxy', 'concrete', 'painting', 'roofing', 'plumbing', 'hvac', 'electrical', 'landscaping', 'cleaning', 'contracting', 'renovation', 'construction'];
      const foundServices = serviceKeywords.filter(k => text.toLowerCase().includes(k)).map(k => k.charAt(0).toUpperCase() + k.slice(1));
      if (foundServices.length > 0) intel.services = foundServices;
    }

    return NextResponse.json({ ok: true, intel });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
