/**
 * CJ token health monitor (expiry + liveness).
 *
 * The CJ Personal Access Token (CJ_API_TOKEN) powers the TLC + Rebag live feeds.
 * Two ways it can go bad, and this checks BOTH:
 *
 *   1. Expiry (proactive) — IF the token is a JWT carrying an `exp` claim, we read
 *      that date straight off the token (no secret, no network) and warn ahead of
 *      time. Note: CJ tokens observed 2026-07-15 are NOT decodable JWTs, so this
 *      path may report "unknown" — that is expected, not an error.
 *   2. Liveness (reactive) — a tiny authenticated CJ request. If CJ answers 401/403
 *      the token is dead NOW (both feeds are 403-ing); anything else means it still
 *      authenticates. This is the reliable signal when expiry can't be read.
 *
 * Runs inside CI where CJ_API_TOKEN already lives, so the token never leaves CI and
 * is never printed. We log only structure (part count, whether an exp claim exists)
 * and the HTTP status of the probe — never any token bytes.
 *
 * Output on $GITHUB_OUTPUT:
 *   status=ok|warn|crit|unknown  reason=healthy|expiring|dead|unknown
 *   days_left=<int|-->  expiry=<YYYY-MM-DD|unknown>
 * Exit code is ALWAYS 0 — a monitor must never fail the pipeline itself.
 *
 * Usage: npx tsx scripts/check-cj-token-expiry.ts [--warn-days=10] [--crit-days=2] [--no-probe]
 */

import { appendFileSync } from "node:fs";

type Status = "ok" | "warn" | "crit" | "unknown";
type Reason = "healthy" | "expiring" | "dead" | "unknown";

const CJ_GRAPHQL_ENDPOINT = "https://ads.api.cj.com/query";

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}
function arg(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const n = Number(hit.split("=")[1]);
  return Number.isFinite(n) ? n : fallback;
}

/** Read a JWT payload's `exp` (seconds since epoch) without verifying the signature.
 *  Returns the exp, or null when the token is not a 3-part JWT or carries no exp. */
function readJwtExp(token: string): { exp: number | null; parts: number; hasExpClaim: boolean } {
  const parts = token.split(".");
  if (parts.length !== 3) return { exp: null, parts: parts.length, hasExpClaim: false };
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    const hasExpClaim = typeof payload.exp === "number";
    return { exp: hasExpClaim ? (payload.exp as number) : null, parts: 3, hasExpClaim };
  } catch {
    return { exp: null, parts: 3, hasExpClaim: false };
  }
}

/** Minimal authenticated CJ request. Returns true if the token authenticates,
 *  false if CJ rejects it (401/403), null if we couldn't reach CJ to decide. */
async function probeLiveness(token: string): Promise<boolean | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(CJ_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query{ __typename }" }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    console.log(`CJ liveness probe: HTTP ${res.status}`);
    if (res.status === 401 || res.status === 403) return false;
    return true; // any non-auth-reject status means the token was accepted
  } catch (e) {
    console.log(`CJ liveness probe: could not reach CJ (${(e as Error).name}). Skipping.`);
    return null;
  }
}

function emit(status: Status, reason: Reason, daysLeft: number | null, expiry: string): void {
  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendFileSync(
      out,
      `status=${status}\nreason=${reason}\ndays_left=${daysLeft ?? "--"}\nexpiry=${expiry}\n`,
    );
  }
}

async function main(): Promise<void> {
  const warnDays = arg("warn-days", 10);
  const critDays = arg("crit-days", 2);
  const token = (process.env.CJ_API_TOKEN || "").trim();

  if (!token) {
    console.log("CJ token: CJ_API_TOKEN not set — nothing to check (unknown).");
    emit("unknown", "unknown", null, "unknown");
    return;
  }

  // 1. Try to read an expiry date off the token (structure only in the log).
  const { exp, parts, hasExpClaim } = readJwtExp(token);
  console.log(`CJ token shape: ${parts}-part${parts === 3 ? `, exp claim present: ${hasExpClaim}` : " (not a JWT)"}`);

  let expiry = "unknown";
  let daysLeft: number | null = null;
  let expStatus: Status = "unknown";
  if (exp !== null) {
    const secsLeft = exp - Math.floor(Date.now() / 1000);
    daysLeft = Math.floor(secsLeft / 86400);
    expiry = new Date(exp * 1000).toISOString().slice(0, 10);
    expStatus = secsLeft <= critDays * 86400 ? "crit" : secsLeft <= warnDays * 86400 ? "warn" : "ok";
    console.log(`CJ token expiry: ${expiry} (${daysLeft}d left) -> ${expStatus}`);
  } else {
    console.log("CJ token expiry: not readable from this token (relying on the liveness probe).");
  }

  // 2. Liveness probe (the reliable signal, especially when expiry is unreadable).
  const alive = flag("no-probe") ? null : await probeLiveness(token);

  // 3. Decide. A dead token (probe rejected) is always critical, regardless of exp.
  if (alive === false) {
    console.log("CJ token: NOT authenticating (CJ rejected it). TLC + Rebag feeds are down now.");
    emit("crit", "dead", daysLeft, expiry);
    return;
  }
  if (expStatus === "crit" || expStatus === "warn") {
    emit(expStatus, "expiring", daysLeft, expiry);
    return;
  }
  // exp says ok, OR exp unknown but the token authenticates (or probe was skipped).
  const reason: Reason = exp !== null ? "healthy" : alive === true ? "healthy" : "unknown";
  const status: Status = reason === "healthy" ? "ok" : "unknown";
  console.log(`CJ token: ${status} (${reason}).`);
  emit(status, reason, daysLeft, expiry);
}

main();
