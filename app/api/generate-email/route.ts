import { NextRequest, NextResponse } from 'next/server';

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  'Cold Introduction': {
    subject: 'Quick question about {business_name}',
    body: `Hi {contact_name},\n\nI came across {business_name} and was impressed by your work in the {industry} space.\n\nI'm {your_name} from {your_company}. We specialize in helping {industry} businesses {goal_statement}.\n\nWould you be open to a quick 15-minute call this week to explore if there's a fit?\n\nBest regards,\n{your_name}\n{your_company}`,
  },
  'Follow-Up #1 (3 days)': {
    subject: 'Following up — {business_name}',
    body: `Hi {contact_name},\n\nJust wanted to follow up on my previous note about {business_name}.\n\nI know things get busy — I just wanted to make sure this didn't get lost. We've helped similar {industry} businesses {goal_statement}, and I think there could be a real opportunity here.\n\nWould you have 10 minutes this week?\n\nBest,\n{your_name}`,
  },
  'Follow-Up #2 (7 days)': {
    subject: 'One last check-in — {business_name}',
    body: `Hi {contact_name},\n\nI'll keep this short — I reached out a week ago about potentially working together.\n\nIf the timing isn't right, no worries at all. But if there's even a chance {business_name} could benefit from {goal_statement}, I'd love to connect.\n\nReply with a time that works, or feel free to ignore this if it's not a fit.\n\nThanks,\n{your_name}\n{your_company}`,
  },
  'Value Proposition': {
    subject: 'How we help {industry} businesses like {business_name}',
    body: `Hi {contact_name},\n\nOne thing that makes {your_company} different: we don't just promise results — we deliver measurable outcomes for {industry} businesses.\n\nOur clients typically see significant improvements within the first 90 days when it comes to {goal_statement}.\n\nWorth a 15-minute conversation to see if this applies to {business_name}?\n\n{your_name}\n{your_company}`,
  },
  'Last Touch': {
    subject: 'Closing the loop — {business_name}',
    body: `Hi {contact_name},\n\nI've reached out a couple of times and haven't heard back — I completely understand, things get busy.\n\nI'll leave the door open. If {business_name} ever needs help with {goal_statement}, feel free to reach out.\n\nWishing you continued success.\n\n{your_name}\n{your_company}`,
  },
  'Partnership Inquiry': {
    subject: 'Partnership opportunity — {your_company} + {business_name}',
    body: `Hi {contact_name},\n\nI've been following {business_name} and I think there may be a compelling partnership opportunity between our organizations.\n\nAt {your_company}, we work with {industry} businesses to {goal_statement}. I believe combining our strengths could create real value for both of our clients.\n\nWould you have 20 minutes to explore this?\n\n{your_name}\n{your_company}`,
  },
};

export async function POST(req: NextRequest) {
  const { template, goal, tone, businessName, contactName, industry, yourName, yourCompany, companyIntel } =
    await req.json();

  const goalStatements: Record<string, string> = {
    'Book a Meeting': 'book more high-value projects and streamline their sales process',
    'Get a Quote': 'reduce costs and improve project efficiency',
    'Partnership': 'grow through strategic partnerships and referral networks',
    'Demo Request': 'leverage AI-powered tools to scale faster with less overhead',
    'General Inquiry': 'achieve their core business goals',
  };

  const tpl = EMAIL_TEMPLATES[template as string] || EMAIL_TEMPLATES['Cold Introduction'];
  let subject = tpl.subject;
  let body = tpl.body;

  const replacements: Record<string, string> = {
    '{business_name}': businessName || 'your business',
    '{contact_name}': contactName || 'there',
    '{industry}': industry || 'service',
    '{your_name}': yourName || 'The Team',
    '{your_company}': yourCompany || 'Our Company',
    '{goal_statement}': goalStatements[goal as string] || goalStatements['General Inquiry'],
  };

  for (const [key, val] of Object.entries(replacements)) {
    const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, val);
    body = body.replace(regex, val);
  }

  if (companyIntel?.highlight) {
    body += `\n\nP.S. I noticed ${companyIntel.highlight} — that's exactly the kind of business we love working with.`;
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are an expert B2B sales copywriter. Rewrite the email to be ${tone || 'professional'}, compelling, and personalized. Keep the body under 150 words. Return JSON: {subject, body}` },
            { role: 'user', content: `Business: ${businessName}, Industry: ${industry}, Goal: ${goal}\n\nSubject: ${subject}\n\n${body}` },
          ],
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      });
      const data = await res.json();
      const enhanced = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      if (enhanced.subject) subject = enhanced.subject;
      if (enhanced.body) body = enhanced.body;
    } catch { /* fall back */ }
  }

  return NextResponse.json({ subject, body });
}
