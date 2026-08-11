import { NextResponse } from "next/server";

export async function GET() {
  // Self-contained stats — reads from localStorage is client-side only,
  // so we return a healthy OK response to keep the status indicator green.
  // Actual stats (Total Runs, Total Leads) are populated client-side.
  return NextResponse.json({
    ok: true,
    total_runs: null,
    total_leads: null,
    last_run: null,
  });
}
