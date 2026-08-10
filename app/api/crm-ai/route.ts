import { NextRequest, NextResponse } from 'next/server';

const BASE44_API_KEY = process.env.BASE44_API_KEY;
const BASE44_AGENT_ID = process.env.BASE44_AGENT_ID || '6a4ae522852a5e08bfa42450';

async function callBase44AI(prompt: string): Promise<string> {
  if (!BASE44_API_KEY) throw new Error('No Base44 API key configured');
  const res = await fetch(`https://api.base44.com/api/apps/${BASE44_AGENT_ID}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': BASE44_API_KEY,
    },
    body: JSON.stringify({ message: prompt }),
  });
  if (!res.ok) throw new Error(`Base44 API error: ${res.status}`);
  const data = await res.json();
  // Handle both streaming and direct response formats
  return data?.message?.content || data?.content || data?.response || data?.text || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contacts = body.contacts || (body.contact ? [body.contact] : []);
    const action: 'score' | 'insight' | 'email' = body.action || 'score';
    const template: string = body.template || 'Cold Intro';

    // ─── EMAIL GENERATION ────────────────────────────────────────────────────
    if (action === 'email') {
      const contact = contacts[0] || {};
      const contactName = contact.name || 'Business';
      const address = contact.address || 'your area';
      const source = contact.source || 'research';
      const insight = contact.aiInsight || '';

      let subject = '';
      let emailBody = '';

      try {
        const prompt = `You are a B2B outreach specialist writing a ${template} email for a lead generation company.

Contact: ${contactName}
Location: ${address}
Source: ${source}
AI Insight: ${insight}
Template type: ${template}

Write a concise, professional cold outreach email (subject + body). Format exactly as:
SUBJECT: [subject line]
BODY:
[email body - 3-5 short paragraphs, conversational, no fluff]

Do NOT use brackets in the final output. Use real content.`;

        const aiText = await callBase44AI(prompt);
        const subjectMatch = aiText.match(/SUBJECT:\s*(.+)/i);
        const bodyMatch = aiText.match(/BODY:\s*([\s\S]+)/i);
        subject = subjectMatch ? subjectMatch[1].trim() : `Outreach to ${contactName}`;
        emailBody = bodyMatch ? bodyMatch[1].trim() : aiText;
      } catch {
        // Fallback templates
        subject = `Quick question about ${contactName}`;
        emailBody = template === 'Follow-Up #1'
          ? `Hi ${contactName} Team,\n\nFollowing up on my previous note. We have active client requests in ${address} and are looking for a reliable contractor to handle overflows.\n\nDo you have bandwidth for additional jobs this month?\n\nBest,\n[Your Name]`
          : `Hi ${contactName} Team,\n\nI noticed your business in ${address}. We specialize in connecting businesses like yours with high-intent B2B clients in your area.\n\nWould you be open to a 5-minute call to explore this?\n\nBest regards,\n[Your Name]`;
      }

      return NextResponse.json({ subject, body: emailBody });
    }

    // ─── SCORING ─────────────────────────────────────────────────────────────
    if (action === 'score' || action === 'insight') {
      const results = [];

      for (const contact of contacts.slice(0, 20)) {
        try {
          const prompt = `You are a CRM AI scoring a B2B sales lead. Analyze this contact and return a JSON score.

Contact data:
- Name: ${contact.name || 'Unknown'}
- Phone: ${contact.phone || 'None'}
- Email: ${contact.email || 'None'}
- Address: ${contact.address || 'None'}
- Source: ${contact.source || 'Unknown'}
- Status: ${contact.status || 'New'}
- Last Contact: ${contact.lastContact || 'Never'}
- Deal Value: ${contact.dealValue || 0}
- Notes: ${contact.notes || 'None'}
- Activity Count: ${(contact.activityLog || []).length}

Score this lead 0-100 based on: data completeness, sales readiness, engagement level, and deal potential.
Return ONLY valid JSON: {"score": NUMBER, "insight": "ONE sentence insight about this lead"}`;

          const aiText = await callBase44AI(prompt);
          // Extract JSON from response
          const jsonMatch = aiText.match(/\{[^}]+\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            results.push({ id: contact.id, score: parsed.score || 50, insight: parsed.insight || '' });
          } else {
            // Fallback rule-based score
            let score = 30;
            if (contact.phone) score += 15;
            if (contact.email) score += 20;
            if (contact.address) score += 10;
            if (contact.status !== 'New') score += 10;
            if ((contact.activityLog || []).length > 0) score += 10;
            if (contact.dealValue > 0) score += 5;
            results.push({ id: contact.id, score: Math.min(score, 100), insight: `Lead has ${contact.phone ? 'phone' : 'no phone'}, ${contact.email ? 'email' : 'no email'}. Status: ${contact.status || 'New'}.` });
          }
        } catch {
          let score = 30;
          if (contact.phone) score += 15;
          if (contact.email) score += 20;
          if (contact.address) score += 10;
          results.push({ id: contact.id, score, insight: 'AI scoring unavailable — basic score applied.' });
        }
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('CRM AI route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
