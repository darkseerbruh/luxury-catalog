import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  // Throttle signups per IP so a bot can't flood the Resend audience.
  const limit = rateLimit("newsletter", clientIp(req.headers), 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    typeof (body as Record<string, unknown>).email !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 });
  }

  const email = ((body as Record<string, unknown>).email as string).trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  // Degrade gracefully when env vars are unset (dev / preview environments).
  if (!apiKey || !audienceId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const res = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email, audience_id: audienceId, unsubscribed: false }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: `Resend error ${res.status}: ${text}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
