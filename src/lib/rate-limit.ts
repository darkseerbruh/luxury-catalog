import "server-only";

/**
 * Lightweight in-memory IP rate limiter. No external deps (no Redis/Upstash).
 *
 * Scope + caveat: state lives in a single serverless instance's memory, so on
 * Vercel it throttles per-instance, not globally. That is intentionally
 * "good enough" as a first line of defense for abuse of paid endpoints (e.g.
 * the Anthropic-backed /api/identify route): it stops a single client from
 * hammering one warm instance, which is the common cheap-attack shape. For
 * hard global guarantees, swap the Map for Upstash Ratelimit later.
 *
 * Uses a fixed-window counter keyed by IP to bound memory and CPU.
 */

interface Window {
  count: number;
  resetAt: number; // epoch ms when the current window expires
}

// One bucket map per named limiter, so different endpoints don't share counts.
const buckets = new Map<string, Map<string, Window>>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Records a hit for `ip` under the named limiter and reports whether it is
 * within `limit` requests per `windowMs`. Lazily evicts expired windows so the
 * map can't grow without bound under churning IPs.
 */
export function rateLimit(
  name: string,
  ip: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map();
    buckets.set(name, bucket);
  }

  // Opportunistic cleanup: drop a few expired entries each call.
  if (bucket.size > 5000) {
    for (const [key, win] of bucket) {
      if (win.resetAt <= now) bucket.delete(key);
    }
  }

  const win = bucket.get(ip);
  if (!win || win.resetAt <= now) {
    bucket.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  win.count += 1;
  if (win.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: limit - win.count, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP from proxy headers. Vercel sets `x-forwarded-for`;
 * the first entry is the real client. Falls back to a constant bucket so a
 * missing header degrades to "all anonymous share one window" (still throttled)
 * rather than bypassing the limit.
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
