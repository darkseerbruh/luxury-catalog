/**
 * Thin Firecrawl v2 client for the capture pipeline. Browser-gathering is now our
 * ONLY data path (eBay API rejected, no affiliate feeds) and Firecrawl is the engine
 * that defeats the resale-site bot-blocks headless — so this runs in CI (GitHub
 * Actions), not a logged-in browser. See docs/data-collection-handoff.md §0a.
 *
 * Cost discipline (verified 2026-06-28): a plain scrape (markdown/rawHtml) = 1 credit;
 * the `json`/LLM-extract format = 5. So we scrape RAW and parse with our own adapters
 * (trr.ts etc.), paying 1 credit/page, never 5.
 *
 * Needs FIRECRAWL_API_KEY in the env (GitHub Actions secret in CI).
 */
const API = "https://api.firecrawl.dev/v2/scrape";

export interface ScrapeResult {
  rawHtml?: string;
  markdown?: string;
  json?: unknown;
  creditsUsed: number;
  statusCode?: number;
}

export interface ScrapeOpts {
  formats?: string[];
  includeTags?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  proxy?: "basic" | "stealth" | "auto";
  /** json-format extraction prompt+schema (costs more credits — avoid when raw parsing works). */
  jsonOptions?: { prompt?: string; schema?: Record<string, unknown> };
}

function key(): string {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error("FIRECRAWL_API_KEY is not set (GitHub Actions secret / local env).");
  return k;
}

/** Scrape one URL. Throws on transport failure; returns the page payload + credits used. */
export async function scrape(url: string, opts: ScrapeOpts = {}): Promise<ScrapeResult> {
  const body: Record<string, unknown> = {
    url,
    formats: opts.formats ?? ["rawHtml"],
    onlyMainContent: opts.onlyMainContent ?? false,
    proxy: opts.proxy ?? "auto",
  };
  if (opts.includeTags) body.includeTags = opts.includeTags;
  if (opts.waitFor) body.waitFor = opts.waitFor;
  if (opts.jsonOptions) {
    body.formats = ["json"];
    body.jsonOptions = opts.jsonOptions;
  }

  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl ${res.status} for ${url}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    success?: boolean;
    data?: { rawHtml?: string; markdown?: string; json?: unknown; metadata?: { creditsUsed?: number; statusCode?: number } };
    error?: string;
  };
  if (!data.success || !data.data) throw new Error(`Firecrawl no data for ${url}: ${data.error ?? "unknown"}`);
  return {
    rawHtml: data.data.rawHtml,
    markdown: data.data.markdown,
    json: data.data.json,
    creditsUsed: data.data.metadata?.creditsUsed ?? 0,
    statusCode: data.data.metadata?.statusCode,
  };
}

/** Polite gap between scrapes so we don't burst a source into rate-limiting. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
