/**
 * The Luxury Closet live-listings adapter (CJ product feed, advertiser 5312449,
 * export subscription 319025). Fetches the CJ HTTP export (basic auth) -> unzip
 * -> parse Quoted CSV -> emit one `listed` PriceObservation per in-stock bag we
 * recognise, with the CJ deep affiliate link as source_url. The shared loader
 * (load-prices.ts) resolves each to a catalog variant (or routes it to
 * discovered_listing) and it surfaces in the bag-page "For sale right now" rail.
 *
 * Run: `npm run ingest:tlc` then `npm run ingest:load -- --write`
 *   (needs CJ_FEED_URL + CJ_FEED_USER + CJ_FEED_PASS in .env.local — the owner
 *    gets these from the CJ feed-export email; they also live in Vercel).
 *
 * We keep ONLY rows whose model we can name (canonicalModel != null), so the
 * 71k all-category feed (shoes, jewellery, clothes) never pollutes the pipeline.
 */
import { unzipSync, strFromU8 } from "fflate";
import { parse } from "csv-parse/sync";
import { parseTlcFeedRows } from "../../../src/lib/ingest/tlc-feed";
import { canonicalModel } from "../../../src/lib/ingest/model-normalize";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env.local"), override: true });

const PLATFORM = "The Luxury Closet";
const SOURCE = "tlc";

/** Fetch the feed and return each CSV/TXT member's text (handles raw CSV or a
 * .zip, detected by the PK magic bytes). */
async function fetchFeedFiles(): Promise<string[]> {
  const url = process.env.CJ_FEED_URL;
  const user = process.env.CJ_FEED_USER;
  const pass = process.env.CJ_FEED_PASS;
  if (!url || !user || !pass) {
    throw new Error("CJ feed env missing (CJ_FEED_URL / CJ_FEED_USER / CJ_FEED_PASS)");
  }
  const res = await fetch(url, {
    headers: { Authorization: "Basic " + Buffer.from(`${user}:${pass}`).toString("base64") },
  });
  if (!res.ok) throw new Error(`CJ feed fetch failed: ${res.status} ${res.statusText}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b; // "PK"
  if (!isZip) return [strFromU8(buf)];
  const files = unzipSync(buf);
  const out: string[] = [];
  for (const name of Object.keys(files)) {
    if (/\.(csv|txt)$/i.test(name)) out.push(strFromU8(files[name]));
  }
  if (!out.length) throw new Error("CJ feed archive had no .csv/.txt member");
  return out;
}

async function run(): Promise<void> {
  const files = await fetchFeedFiles();
  const observedOn = new Date().toISOString().slice(0, 10);

  const listings = files.flatMap((csv) => {
    const rows = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
    }) as Record<string, string>[];
    return parseTlcFeedRows(rows, { currency: "USD" });
  });

  let skippedUnknownModel = 0;
  let skippedOutOfStock = 0;
  const observations: PriceObservation[] = [];
  for (const l of listings) {
    if (l.availability !== "in_stock") {
      skippedOutOfStock++;
      continue;
    }
    const price = l.salePrice ?? l.price;
    if (!price || price <= 0) continue;
    const brand = l.brandName;
    const model = brand ? canonicalModel(brand, l.title) : null;
    if (!brand || !model) {
      skippedUnknownModel++;
      continue; // only bags we can name — never guess a style
    }
    observations.push({
      brand,
      style: model,
      attrs: {
        exterior_colorway: l.color,
        exterior_material: l.material,
        condition_detail: l.itemCondition,
        listing_ref: l.externalId,
      },
      platform: PLATFORM,
      price_type: "listed",
      sale_price: price,
      currency: "USD",
      condition: null,
      observed_on: observedOn,
      source_url: l.clickUrl,
      confidence: "high",
      notes: l.salePrice != null && l.price != null && l.salePrice < l.price
        ? `on sale from ${l.price}`
        : null,
    });
  }

  const { file, kept, dropped } = writeObservations(SOURCE, observations);
  console.log(
    `[tlc] feed rows(USD)=${listings.length} · emitted=${observations.length} · kept=${kept} · dropped=${dropped}\n` +
      `      skipped: unknown-model=${skippedUnknownModel}, out-of-stock=${skippedOutOfStock}\n` +
      `      -> ${file}\n      next: npm run ingest:load -- --write`
  );
}

run().catch((err) => {
  console.error("[tlc] ingest failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
