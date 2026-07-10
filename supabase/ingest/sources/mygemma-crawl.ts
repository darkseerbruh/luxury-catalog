/**
 * myGemma MASTER crawler (SERVER-SIDE, no browser) — an open-Shopify reseller
 * (bags / jewellery / watches). Registry had it as a Firecrawl source; the open
 * `/collections/handbags/products.json` feed makes it FREE.
 *
 * We crawl the HANDBAGS COLLECTION (not the root — the root is sneaker-heavy), so the
 * feed is bags-only. Answers plain Node fetches (verified 2026-07-10, HTTP 200).
 *
 *   npx tsx supabase/ingest/sources/mygemma-crawl.ts [collection-slug] [--max-pages=N]
 *     collection-slug   default "handbags"
 *     --max-pages=N     safety cap (default 200)
 *
 * Merges (dedup by url) into `data/ingest/_raw/mygemma.json` that `mygemma.ts --raw`
 * consumes, and overwrites the live snapshot the reconcile step diffs against. Mirrors
 * fashionphile-crawl.ts (collection-scoped) / redeluxe-crawl.ts.
 *
 * Legal posture: prices are facts; every row carries source_url. Never ingest photos or
 * verbatim descriptions (the adapter mines stated facts only). Rate-limit politely.
 */
import fs from "fs";
import path from "path";

const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/mygemma.json");
const LIVE_SNAPSHOT = path.resolve(__dirname, "../../../data/ingest/_raw/mygemma-live.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const LIMIT = 250;
const PAGE_DELAY_MS = 400;
const COOLDOWN_EVERY = 24;
const COOLDOWN_MS = 8000;
const BACKOFFS = [5000, 15000, 30000, 60000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RawDumpEntry {
  product: {
    title?: string; handle?: string; vendor?: string; product_type?: string;
    tags?: string[]; variants?: unknown[];
    created_at?: string; published_at?: string; updated_at?: string;
  };
  url?: string;
}

async function fetchPage(slug: string, page: number): Promise<RawDumpEntry["product"][] | null> {
  const url = `https://www.mygemma.com/collections/${slug}/products.json?limit=${LIMIT}&page=${page}`;
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
      status = -1;
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
  const maxPages = Number((args.find((a) => a.startsWith("--max-pages=")) ?? "--max-pages=200").split("=")[1]);
  const startPage = Number((args.find((a) => a.startsWith("--start-page=")) ?? "--start-page=1").split("=")[1]);

  console.log(`myGemma master crawl: /collections/${slug}/ (pages ${startPage}–${maxPages})`);
  const fresh: RawDumpEntry[] = [];
  for (let page = startPage; page <= maxPages; page++) {
    const products = await fetchPage(slug, page);
    if (products === null) break;
    if (products.length === 0) break;
    for (const p of products) {
      fresh.push({
        product: {
          title: p.title, handle: p.handle, vendor: p.vendor, product_type: p.product_type,
          tags: p.tags, variants: p.variants,
          created_at: p.created_at, published_at: p.published_at, updated_at: p.updated_at,
        },
        url: `https://www.mygemma.com/products/${p.handle}`,
      });
    }
    if (page % 10 === 0 || products.length < LIMIT) {
      console.log(`  page ${page}: +${products.length} (running total ${fresh.length})`);
    }
    if (products.length < LIMIT) break;
    await sleep(PAGE_DELAY_MS);
    if (page % COOLDOWN_EVERY === 0) {
      console.log(`  …cooldown ${COOLDOWN_MS / 1000}s after ${page} pages`);
      await sleep(COOLDOWN_MS);
    }
  }
  console.log(`Crawled ${fresh.length} listing(s) from myGemma /collections/${slug}/.`);

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
