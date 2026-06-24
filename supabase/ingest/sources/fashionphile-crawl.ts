/**
 * Fashionphile MASTER crawler (SERVER-SIDE — no browser) — captures EVERY active
 * listing in a Fashionphile collection, not just a brand/token slice.
 *
 * Fashionphile runs on Shopify; `/collections/<slug>/products.json` answers plain
 * Node fetches (verified 2026-06-24). The default `handbags` collection is the
 * site-wide bag inventory. The endpoint THROTTLES a rapid burst (≈25 quick pages →
 * HTTP 503), but the 503 is transient: a short backoff recovers it. So this crawler
 * paces politely and retries 503/429 with escalating backoff, paginating until a
 * page returns < limit (the true end).
 *
 *   npx tsx supabase/ingest/sources/fashionphile-crawl.ts [collection-slug] [--max-pages=N]
 *     collection-slug   default "handbags" (site-wide bags). Use "all" for everything.
 *     --max-pages=N     safety cap (default 400 → up to 100k listings)
 *
 * Merges (dedup by url) into the raw dump `data/ingest/_raw/fashionphile.json` that
 * `fashionphile.ts --raw` consumes. Additive: existing captures are preserved/refreshed.
 * Then: `npx tsx supabase/ingest/sources/fashionphile.ts --raw` and `load:prices --write`.
 *
 * Legal posture: prices are facts; every row carries source_url. Never ingest photos
 * or verbatim descriptions (the adapter parses facts out of body_html; nothing verbatim
 * is persisted). Rate-limit politely.
 */
import fs from "fs";
import path from "path";

const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/fashionphile.json");
// Authoritative "what's live right now" set for reconcile-sold.ts (overwritten each full run).
const LIVE_SNAPSHOT = path.resolve(__dirname, "../../../data/ingest/_raw/fashionphile-live.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const LIMIT = 250;
const PAGE_DELAY_MS = 400; // polite gap between successful pages
const COOLDOWN_EVERY = 24; // pages between a longer cooldown
const COOLDOWN_MS = 8000;
const BACKOFFS = [5000, 15000, 30000, 60000]; // 503/429 retry waits

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RawDumpEntry {
  product: { title?: string; handle?: string; body_html?: string; tags?: string[]; variants?: unknown[] };
  url?: string;
}

/** Fetch one page with retry-on-throttle. Returns products, or null at true end. */
async function fetchPage(slug: string, page: number): Promise<RawDumpEntry["product"][] | null> {
  const url = `https://www.fashionphile.com/collections/${slug}/products.json?limit=${LIMIT}&page=${page}`;
  for (let attempt = 0; attempt <= BACKOFFS.length; attempt++) {
    let status = 0;
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      status = r.status;
      if (r.ok) {
        const j = (await r.json()) as { products?: RawDumpEntry["product"][] };
        return j.products ?? [];
      }
    } catch {
      status = -1; // network blip → treat like a retryable throttle
    }
    if ((status === 503 || status === 429 || status === -1) && attempt < BACKOFFS.length) {
      const wait = BACKOFFS[attempt];
      console.log(`  page ${page}: HTTP ${status} — backoff ${wait / 1000}s (attempt ${attempt + 1})`);
      await sleep(wait);
      continue;
    }
    console.error(`  page ${page}: HTTP ${status} — giving up after ${attempt} retr${attempt === 1 ? "y" : "ies"}`);
    return null;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--")) ?? "handbags";
  const maxPages = Number((args.find((a) => a.startsWith("--max-pages=")) ?? "--max-pages=400").split("=")[1]);
  const startPage = Number((args.find((a) => a.startsWith("--start-page=")) ?? "--start-page=1").split("=")[1]);

  console.log(`Fashionphile master crawl: /collections/${slug}/ (pages ${startPage}–${maxPages})`);
  const fresh: RawDumpEntry[] = [];
  for (let page = startPage; page <= maxPages; page++) {
    const products = await fetchPage(slug, page);
    if (products === null) break; // unrecoverable error
    if (products.length === 0) break; // true end
    for (const p of products) {
      fresh.push({
        product: { title: p.title, handle: p.handle, body_html: p.body_html, tags: p.tags, variants: p.variants },
        url: `https://www.fashionphile.com/products/${p.handle}`,
      });
    }
    if (page % 10 === 0 || products.length < LIMIT) {
      console.log(`  page ${page}: +${products.length} (running total ${fresh.length})`);
    }
    if (products.length < LIMIT) break; // last page
    await sleep(PAGE_DELAY_MS);
    if (page % COOLDOWN_EVERY === 0) {
      console.log(`  …cooldown ${COOLDOWN_MS / 1000}s after ${page} pages`);
      await sleep(COOLDOWN_MS);
    }
  }
  console.log(`Crawled ${fresh.length} listing(s) from /collections/${slug}/`);

  // The _raw landing dir is gitignored, so it's absent in a fresh CI checkout — create
  // it before writing or the whole crawl is lost at the final save (ENOENT).
  fs.mkdirSync(path.dirname(RAW_DUMP), { recursive: true });

  const existing: RawDumpEntry[] = fs.existsSync(RAW_DUMP) ? JSON.parse(fs.readFileSync(RAW_DUMP, "utf8")) : [];
  const byUrl = new Map(existing.map((e) => [e.url, e]));
  let added = 0;
  for (const e of fresh) {
    if (!byUrl.has(e.url)) added++;
    byUrl.set(e.url, e);
  }
  const merged = [...byUrl.values()];
  fs.writeFileSync(RAW_DUMP, JSON.stringify(merged));
  console.log(`dump: ${existing.length} existing + ${added} new = ${merged.length} total -> ${RAW_DUMP}`);

  // Current-run LIVE snapshot (overwrite, NOT merged): exactly what this crawl saw on
  // the site right now. The accumulating dump above is the loader's history staging and
  // keeps stale entries forever, so it can't tell "still for sale" from "sold". This
  // snapshot is the authoritative live set reconcile-sold.ts diffs against to retire the
  // listings that have since sold/been pulled. Only written for a full crawl (start at
  // page 1) — a resumed/partial crawl must not be mistaken for the whole live inventory.
  if (startPage === 1) {
    fs.writeFileSync(LIVE_SNAPSHOT, JSON.stringify(fresh));
    console.log(`live snapshot: ${fresh.length} listing(s) seen this run -> ${LIVE_SNAPSHOT}`);
  } else {
    console.log(`live snapshot: SKIPPED (started at page ${startPage}; not a full crawl).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
