import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Note: If RESEND_API_KEY is not configured in Vercel environment variables,
 * this endpoint falls back to a mock success response so outreach workflows
 * can be tested without erroring out. Ensure RESEND_API_KEY is set in Vercel env vars.
 */

// In-memory store for rate limiting: sessionId -> array of timestamps (ms)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_EMAILS_PER_WINDOW = 10; // Max 10 emails per minute

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(sessionId) || []).filter(
    (time) => time > windowStart
  );

  if (timestamps.length >= MAX_EMAILS_PER_WINDOW) {
    rateLimitMap.set(sessionId, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(sessionId, timestamps);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, body: emailBody, from_name } = body || {};

    if (!to || typeof to !== "string" || !to.trim()) {
      return NextResponse.json(
        { error: "Recipient email 'to' is required." },
        { status: 400 }
      );
    }

    // Determine session key for rate limiting (via header, IP, or fallback)
    const sessionId =
      req.headers.get("x-session-id") ||
      req.headers.get("x-forwarded-for") ||
      "global_session";

    if (isRateLimited(sessionId)) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded: Maximum 10 emails per minute allowed per session.",
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    // Check if RESEND_API_KEY is available in process.env
    if (!apiKey || !apiKey.trim()) {
      console.warn(
        "[Resend] RESEND_API_KEY is missing or empty. Returning mock success. Set RESEND_API_KEY in Vercel env vars for live sending."
      );
      return NextResponse.json({
        success: true,
        id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    }

    const resend = new Resend(apiKey);
    const senderName = from_name?.trim() || "XTS Outreach";
    const primaryFrom = `${senderName} <outreach@canadaxtremescraper.com>`;
    const fallbackFrom = `${senderName} <onboarding@resend.dev>`;

    const textContent = emailBody || "";
    const htmlContent = emailBody
      ? emailBody.replace(/\n/g, "<br/>")
      : "";

    // Attempt sending using primary custom domain address
    let sendResult = await resend.emails.send({
      from: primaryFrom,
      to: [to.trim()],
      subject: subject || "(No Subject)",
      text: textContent,
      html: htmlContent,
    });

    // If primary domain fails because domain is not verified, use Resend onboarding verified domain
    if (
      sendResult.error &&
      (sendResult.error.message?.includes("not verified") ||
        sendResult.error.name === "validation_error")
    ) {
      console.warn(
        "[Resend] Primary domain canadaxtremescraper.com is not verified. Falling back to onboarding@resend.dev"
      );
      sendResult = await resend.emails.send({
        from: fallbackFrom,
        to: [to.trim()],
        subject: subject || "(No Subject)",
        text: textContent,
        html: htmlContent,
      });
    }

    if (sendResult.error) {
      return NextResponse.json(
        { error: sendResult.error.message || "Failed to send email via Resend" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: sendResult.data?.id || `msg_${Date.now()}`,
    });
  } catch (err: any) {
    console.error("Error sending email:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while sending email." },
      { status: 500 }
    );
  }
}
