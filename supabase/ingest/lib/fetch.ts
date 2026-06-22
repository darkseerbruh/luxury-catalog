/**
 * Polite HTTP client for the price-ingestion adapters. Descriptive User-Agent,
 * per-host rate limiting, retry-with-backoff. Keeps us a well-behaved client
 * (docs/data-sourcing-research.md §1) — facts are fair to read, but we read them
 * gently. No app imports; used only by supabase/ingest/sources/*.
 */

const UA =
  "LuxuryCatalogBot/0.1 (+https://www.luxurycatalog.com; price reference, attributed) ";

const lastHit = new Map<string, number>();
const MIN_GAP_MS = 2000; // >=2s between requests to the same host

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function throttle(url: string): Promise<void> {
  const h = host(url);
  const since = Date.now() - (lastHit.get(h) ?? 0);
  if (since < MIN_GAP_MS) await sleep(MIN_GAP_MS - since);
  lastHit.set(h, Date.now());
}

export interface FetchOptions {
  retries?: number;
  timeoutMs?: number;
  accept?: string;
}

/** Fetch text politely, retrying transient failures with backoff. */
export async function politeFetchText(url: string, opts: FetchOptions = {}): Promise<string> {
  const { retries = 3, timeoutMs = 20000, accept = "text/html,application/json" } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: accept },
        signal: ctrl.signal,
        redirect: "follow",
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} (non-retryable)`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
    }
  }
  throw new Error(`fetch failed for ${url}: ${String(lastErr)}`);
}

/** Fetch + parse JSON (used for the Wayback CDX API). */
export async function politeFetchJson<T = unknown>(url: string, opts: FetchOptions = {}): Promise<T> {
  const text = await politeFetchText(url, { accept: "application/json", ...opts });
  return JSON.parse(text) as T;
}
