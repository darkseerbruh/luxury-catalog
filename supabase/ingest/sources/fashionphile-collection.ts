/**
 * Fashionphile collection fetcher (SERVER-SIDE — no browser needed).
 *
 * Fashionphile runs on Shopify and its per-brand collection JSON is served from a
 * CDN that answers plain server-side requests (verified 2026-06-23: a Node fetch of
 * `/collections/<brand>/products.json` returns 200 + full product objects). This
 * supersedes the old browser-dump step for Fashionphile in the common case — the
 * on-site *search* is still bot-blocked/JS-rendered, but the collection JSON is not.
 *
 * Pages through a brand collection, optionally filters to products whose handle or
 * title contains ALL of the given tokens, and MERGES the results (dedup by url) into
 * the raw dump `data/ingest/_raw/fashionphile.json` that the `--raw` adapter consumes.
 * Additive: existing hero captures in the dump are preserved.
 *
 *   npx tsx supabase/ingest/sources/fashionphile-collection.ts <brand-slug> [token ...]
 *
 * e.g.  fashionphile-collection.ts chanel boy      # all Chanel products whose handle/title has "boy"
 *       fashionphile-collection.ts gucci jackie     # Gucci Jackie
 *       fashionphile-collection.ts saint-laurent loulou
 *
 * Then run `npx tsx supabase/ingest/sources/fashionphile.ts --raw` to map → landing,
 * and `load:prices --write`.
 */
import fs from "fs";
import path from "path";

const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/fashionphile.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

interface RawDumpEntry {
  product: { title?: string; handle?: string; body_html?: string; tags?: string[]; variants?: unknown[] };
  url?: string;
}

async function fetchCollection(brandSlug: string, tokens: string[]): Promise<RawDumpEntry[]> {
  const out: RawDumpEntry[] = [];
  for (let page = 1; page <= 25; page++) {
    const url = `https://www.fashionphile.com/collections/${brandSlug}/products.json?limit=250&page=${page}`;
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!r.ok) {
      console.error(`  page ${page}: HTTP ${r.status} — stopping`);
      break;
    }
    const j = (await r.json()) as { products?: Array<RawDumpEntry["product"]> };
    const products = j.products ?? [];
    if (products.length === 0) break;
    for (const p of products) {
      const hay = `${(p.handle ?? "").toLowerCase()} ${(p.title ?? "").toLowerCase()}`;
      if (tokens.every((t) => hay.includes(t.toLowerCase()))) {
        out.push({
          product: { title: p.title, handle: p.handle, body_html: p.body_html, tags: p.tags, variants: p.variants },
          url: `https://www.fashionphile.com/products/${p.handle}`,
        });
      }
    }
    // polite pacing
    await new Promise((res) => setTimeout(res, 250));
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const [brandSlug, ...tokens] = args;
  if (!brandSlug) {
    console.error("Usage: tsx fashionphile-collection.ts <brand-slug> [token ...]");
    process.exit(1);
  }
  console.log(`Fashionphile: fetching /collections/${brandSlug}/ filtering for [${tokens.join(", ") || "ALL"}] ...`);
  const fresh = await fetchCollection(brandSlug, tokens);
  console.log(`  matched ${fresh.length} product(s)`);

  const existing: RawDumpEntry[] = fs.existsSync(RAW_DUMP) ? JSON.parse(fs.readFileSync(RAW_DUMP, "utf8")) : [];
  const byUrl = new Map(existing.map((e) => [e.url, e]));
  let added = 0;
  for (const e of fresh) {
    if (!byUrl.has(e.url)) added++;
    byUrl.set(e.url, e); // refresh price/spec on re-run
  }
  const merged = [...byUrl.values()];
  fs.writeFileSync(RAW_DUMP, JSON.stringify(merged));
  console.log(`  dump: ${existing.length} existing + ${added} new = ${merged.length} total -> ${RAW_DUMP}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
