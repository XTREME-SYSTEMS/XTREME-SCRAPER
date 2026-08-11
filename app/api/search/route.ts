import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SEARCH_URL ?? "https://www.xtremescraper.com/api/search";

// Social media and non-business domains to filter out of results
const JUNK_NAMES = new Set([
  "facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok",
  "pinterest", "snapchat", "reddit", "yelp", "google", "apple", "amazon",
  "united states", "canada", "united kingdom", "not listed", "n/a", "na",
]);

const JUNK_WEBSITES = ["facebook.com", "twitter.com", "instagram.com", "linkedin.com",
  "youtube.com", "tiktok.com", "pinterest.com", "snapchat.com", "reddit.com"];

function isJunkResult(r: Record<string, string>): boolean {
  const name = (r.company_name || "").toLowerCase().trim();
  const website = (r.website || "").toLowerCase();
  if (JUNK_NAMES.has(name)) return true;
  if (JUNK_WEBSITES.some(d => website.includes(d))) return true;
  // Filter duplicates: if name is empty or just numbers
  if (!name || /^\d+$/.test(name)) return true;
  return false;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON request body" }, { status: 400 });
  }

  const payload = JSON.stringify(body);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchWithTimeout(
        BACKEND_URL,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: payload },
        20000
      );

      if (res.ok) {
        const data = await res.json();

        // Filter junk results (social media, duplicates, garbage)
        if (Array.isArray(data.results)) {
          // Deduplicate by phone number — keep first occurrence
          const seenPhones = new Set<string>();
          data.results = data.results.filter((r: Record<string, string>) => {
            if (isJunkResult(r)) return false;
            const phone = (r.phone || "").replace(/\D/g, "");
            if (phone && phone.length >= 7) {
              if (seenPhones.has(phone)) return false;
              seenPhones.add(phone);
            }
            return true;
          });
        }

        return NextResponse.json(data, { status: res.status });
      }
    } catch {
      // Fetch threw or timed out
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return NextResponse.json(
    { ok: false, error: "Search service temporarily unavailable. Please try again.", retryable: true },
    { status: 503 }
  );
}
