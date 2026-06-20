/**
 * Minimal transactional email via Resend's HTTP API (no SDK dependency).
 * No-ops and returns false when RESEND_API_KEY is unset, so price alerts fall
 * back to in-app notifications only. Server-only.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.ALERTS_FROM_EMAIL ?? "alerts@luxurycatalog.com",
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("sendEmail error:", err);
    return false;
  }
}
