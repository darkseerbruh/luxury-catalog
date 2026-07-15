/**
 * CJ token expiry alarm.
 *
 * CJ's Personal Access Token is a JWT (https://developers.cj.com/authentication/overview),
 * and a JWT carries its own expiry date in the `exp` claim. That date is readable
 * straight off the token with NO secret and NO network call, so we can warn BEFORE
 * the token lapses instead of finding out via a 403 on a live feed.
 *
 * This runs inside the GitHub Action where CJ_API_TOKEN already lives, so the token
 * never leaves CI and is never printed. We only ever read + report its expiry.
 *
 * Output: a human line for the log, plus machine fields on $GITHUB_OUTPUT
 *   status=ok|warn|crit|unknown   days_left=<int|-->   expiry=<YYYY-MM-DD|unknown>
 * Exit code is ALWAYS 0 — an expiry warning must never fail the pipeline itself
 * (the feed jobs have their own hard preflight for a missing/invalid token).
 *
 * Usage: npx tsx scripts/check-cj-token-expiry.ts [--warn-days=10] [--crit-days=2]
 */

import { appendFileSync } from "node:fs";

type Status = "ok" | "warn" | "crit" | "unknown";

function arg(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const n = Number(hit.split("=")[1]);
  return Number.isFinite(n) ? n : fallback;
}

/** Decode a JWT payload's `exp` (seconds since epoch) without verifying the signature. */
function readJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function emit(status: Status, daysLeft: number | null, expiry: string): void {
  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendFileSync(
      out,
      `status=${status}\ndays_left=${daysLeft ?? "--"}\nexpiry=${expiry}\n`,
    );
  }
}

function main(): void {
  const warnDays = arg("warn-days", 10);
  const critDays = arg("crit-days", 2);
  const token = (process.env.CJ_API_TOKEN || "").trim();

  if (!token) {
    console.log("CJ token expiry: CJ_API_TOKEN not set — nothing to check (unknown).");
    emit("unknown", null, "unknown");
    return;
  }

  const exp = readJwtExp(token);
  if (exp === null) {
    // Not a decodable JWT (format change, or an opaque token). Don't false-alarm.
    console.log(
      "CJ token expiry: token is not a decodable JWT — cannot read an expiry date (unknown). " +
        "If CJ has changed its token format, update this check.",
    );
    emit("unknown", null, "unknown");
    return;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const secsLeft = exp - nowSec;
  const daysLeft = Math.floor(secsLeft / 86400);
  const expiry = new Date(exp * 1000).toISOString().slice(0, 10);

  let status: Status = "ok";
  if (secsLeft <= critDays * 86400) status = "crit";
  else if (secsLeft <= warnDays * 86400) status = "warn";

  const line =
    status === "crit"
      ? secsLeft <= 0
        ? `CJ token expiry: EXPIRED on ${expiry}. Rotate now — TLC + Rebag feeds will 403.`
        : `CJ token expiry: CRITICAL — expires ${expiry} (${daysLeft}d left). Rotate now.`
      : status === "warn"
        ? `CJ token expiry: heads-up — expires ${expiry} (${daysLeft}d left). Schedule a rotation.`
        : `CJ token expiry: OK — expires ${expiry} (${daysLeft}d left).`;
  console.log(line);
  emit(status, daysLeft, expiry);
}

main();
