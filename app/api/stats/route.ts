import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_STATS_URL ?? "https://www.xtremescraper.com/api/stats";

export async function GET() {
  try {
    const res = await fetch(BACKEND_URL, { next: { revalidate: 60 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ total_runs: null, total_leads: null, last_run: null });
  }
}
