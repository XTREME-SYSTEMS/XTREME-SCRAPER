import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SCRAPE_URL ?? "https://www.xtremescraper.com/api/scrape";

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
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
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        },
        15000
      );

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
    } catch {
      // Fetch threw or timed out
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: "Search service temporarily unavailable. Please try again in a moment.",
      retryable: true,
    },
    { status: 503 }
  );
}
