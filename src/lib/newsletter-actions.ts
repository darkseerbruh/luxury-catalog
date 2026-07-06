"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "./supabase/admin";
import { rateLimit, clientIp } from "./rate-limit";

/**
 * Newsletter opt-in — CAPTURE ONLY (the email channel from
 * docs/automation-map.md). This action records who asked and where; it sends
 * nothing. Unsubscribe handling + double opt-in (the `confirmed` flag on
 * newsletter_subscriber) ship together with the first Resend send, so no dead
 * unsubscribe links or unconfirmable emails exist today.
 *
 * Durable store = the newsletter_subscriber table (migration 0045), written
 * with the service-role client (the table has RLS on and zero policies, so
 * anon/authenticated can neither read nor write it). A Resend audience add is
 * layered on as a best-effort mirror so the first campaign starts with a
 * ready audience; it never fails the signup.
 */

export interface NewsletterResult {
  ok: boolean;
  /** Human-readable reason when ok is false. Safe to show the user as-is. */
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Postgres/PostgREST codes for "the table isn't there yet". The owner applies
 *  migrations after merge (deploy-then-migrate), so this state is normal. */
function isMissingTable(code: string | undefined, message: string): boolean {
  return (
    code === "42P01" || // undefined_table (raw Postgres)
    code === "PGRST205" || // PostgREST: table not in schema cache
    /newsletter_subscriber.*(does not exist|schema cache)/i.test(message)
  );
}

const NOT_READY =
  "Signups aren't open just yet. Check back soon.";

/**
 * Subscribe an email to the newsletter, tagged with the placement that
 * captured it (footer, articles_index, homepage, taste_page, ...).
 * Idempotent: an email that's already on the list reports success.
 */
export async function subscribeNewsletter(
  email: string,
  source?: string,
): Promise<NewsletterResult> {
  const clean = String(email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  // Throttle per IP so a bot can't flood the list (same window the old
  // /api/newsletter/subscribe route used).
  try {
    const h = await headers();
    const limit = rateLimit("newsletter", clientIp(h as Headers), 5, 10 * 60 * 1000);
    if (!limit.ok) {
      return { ok: false, error: "Too many tries. Give it a few minutes." };
    }
  } catch {
    // headers() unavailable (e.g. static render) — skip the throttle.
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("newsletter_subscriber").insert({
      email: clean,
      source: source ? String(source).slice(0, 64) : null,
    });

    if (error) {
      // Already subscribed = success (idempotent), not an error to the user.
      if (error.code === "23505") return { ok: true };
      // Migration 0045 not applied yet: degrade to a friendly line, never a 500.
      if (isMissingTable(error.code, error.message)) {
        console.warn("subscribeNewsletter: newsletter_subscriber missing (apply migration 0045).");
        return { ok: false, error: NOT_READY };
      }
      console.error("subscribeNewsletter insert error:", error);
      return { ok: false, error: "Something went wrong. Try again." };
    }
  } catch (err) {
    // Admin client couldn't even be constructed (no service key in this
    // environment, e.g. a preview worktree). Same graceful line.
    console.warn("subscribeNewsletter unavailable:", err);
    return { ok: false, error: NOT_READY };
  }

  // Best-effort mirror into the Resend audience (when env is configured) so
  // the first send starts with a ready list. Never fails the signup: the
  // Supabase row above is the source of truth.
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (apiKey && audienceId) {
    try {
      await fetch("https://api.resend.com/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email: clean, audience_id: audienceId, unsubscribed: false }),
      });
    } catch (err) {
      console.warn("subscribeNewsletter: Resend mirror failed (row saved):", err);
    }
  }

  return { ok: true };
}
