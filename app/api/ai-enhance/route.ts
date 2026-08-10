// AI enhance endpoint — calls OpenAI if key available, otherwise uses smart keyword expansion
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  
  // Smart keyword expansion (works without OpenAI key too)
  const enhancements: Record<string, string> = {
    'epoxy': 'epoxy floor coating contractors commercial industrial',
    'floor': 'flooring contractors commercial residential installation',
    'paint': 'commercial painting contractors interior exterior',
    'roof': 'commercial roofing contractors flat metal TPO installation',
    'concrete': 'concrete polishing grinding coating contractors commercial',
    'clean': 'commercial janitorial cleaning services office industrial',
    'plumb': 'commercial plumbing contractors installation repair',
    'hvac': 'HVAC mechanical contractors commercial industrial installation',
    'electric': 'electrical contractors commercial industrial licensed',
    'landscape': 'commercial landscaping contractors maintenance installation',
    'general': 'general contractors commercial construction renovation',
    'dental': 'dental offices practices general cosmetic sedation',
    'account': 'accounting CPA bookkeeping tax preparation firms',
    'insur': 'commercial business insurance agencies brokers',
    'gym': 'fitness gyms studios personal training CrossFit',
    'auto': 'auto repair shops body mechanics certified service',
    'moving': 'moving companies commercial residential relocation',
    'staffing': 'staffing temp employment agencies commercial industrial',
  };
  
  const lower = (query || '').toLowerCase();
  let enhanced = query || '';
  
  for (const [key, expansion] of Object.entries(enhancements)) {
    if (lower.includes(key)) {
      enhanced = expansion;
      break;
    }
  }
  
  // Try OpenAI if key available
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: 'You enhance business search queries to find the best leads. Return ONLY the enhanced search phrase, 5-8 words max, no explanation.'
          }, {
            role: 'user', content: `Enhance this search query for finding business leads: "${query}"`
          }],
          max_tokens: 30
        })
      });
      const data = await res.json();
      enhanced = data.choices?.[0]?.message?.content?.trim() || enhanced;
    } catch {}
  }
  
  return NextResponse.json({ enhanced });
}
