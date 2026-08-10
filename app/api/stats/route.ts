import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_STATS_URL ?? "https://www.xtremescraper.com/api/stats";

export async function GET() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(BACKEND_URL, {
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) {
      return NextResponse.json({ ok: false, total_runs: null, total_leads: null, last_run: null }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, total_runs: null, total_leads: null, last_run: null }, { status: 503 });
  }
}
