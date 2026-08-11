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
    const body = await req.json();

    // Support two call signatures:
    // 1. Bulk outreach: { subject, company_name, city, context }
    // 2. Single lead:  { lead, template, tone }
    let prompt: string;
    let fallbackSubject: string;
    let fallbackBody: string;

    if (body.subject !== undefined || body.company_name !== undefined) {
      // Bulk outreach AI generate
      const subject = body.subject || 'Partnership opportunity';
      const company = body.company_name || '{company_name}';
      const city = body.city || '{city}';
      prompt = `Write a professional, concise cold outreach email.
Subject line: "${subject}"
Company name placeholder: ${company}
City placeholder: ${city}
Instructions: ${body.context || 'Write a compelling, short cold email under 120 words. Use {company_name} and {city} as placeholders where relevant. Do not use filler opener phrases like "I hope this email finds you well". Be direct and value-focused.'}

Return ONLY the email body text. No subject line. No labels. Just the body.`;
      fallbackSubject = subject;
      fallbackBody = `Hi Team at {company_name},\n\nWe help service businesses in {city} acquire more high-intent commercial clients without upfront cost.\n\nWould you be open to a brief 5-minute call this week?\n\nBest regards,\n[Your Name]`;
    } else {
      // Single lead format
      const { lead, template, tone } = body;
      const name = lead?.name || 'Business';
      const phone = lead?.phone || '';
      const address = lead?.address || 'your area';
      prompt = `Write a ${tone || 'professional'} B2B cold outreach email for this lead.

Business: ${name}
Location: ${address}
Phone: ${phone}
Template style: ${template || 'Cold Intro'}

Format exactly as:
SUBJECT: [subject]
BODY:
[body - 3-4 paragraphs, personalized, no filler phrases]`;
      fallbackSubject = `Quick question about ${name}`;
      fallbackBody = `Hi ${name} Team,\n\nI came across your business in ${address} and wanted to reach out directly.\n\nWe help local businesses like yours connect with high-intent commercial clients in your area.\n\nWould a quick 5-minute call work this week?\n\nBest,\n[Your Name]`;
    }

    try {
      const aiText = await callBase44AI(prompt);

      if (body.subject !== undefined || body.company_name !== undefined) {
        // Bulk outreach — return just the body
        return NextResponse.json({ body: aiText.trim() || fallbackBody });
      } else {
        // Single lead — parse subject + body
        const subjectMatch = aiText.match(/SUBJECT:\s*(.+)/i);
        const bodyMatch = aiText.match(/BODY:\s*([\s\S]+)/i);
        return NextResponse.json({
          subject: subjectMatch ? subjectMatch[1].trim() : fallbackSubject,
          body: bodyMatch ? bodyMatch[1].trim() : aiText
        });
      }
    } catch {
      return NextResponse.json({
        subject: fallbackSubject,
        body: fallbackBody
      });
    }
  } catch {
    return NextResponse.json({ error: 'Email generation failed' }, { status: 500 });
  }
}
