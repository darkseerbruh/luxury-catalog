/**
 * myGemma source adapter — the LICENSED path. Reads myGemma's Awin product datafeed
 * (Google/Enhanced format, feed F512) instead of scraping the Shopify storefront, so
 * every listing arrives with a feed-licensed `image_link` (display + link-back while
 * live) and Awin's tracked `aw_deep_link` — the same shape TLC gets from its CJ feed.
 * Replaces the mygemma-crawl.ts + mygemma.ts pair.
 *
 *   AWIN_MYGEMMA_FEED_URL=… npx tsx supabase/ingest/sources/mygemma-awin.ts   # fetch the feed
 *   npx tsx supabase/ingest/sources/mygemma-awin.ts --file data/…/feed.csv.gz # local test
 *   npm run load:prices -- mygemma --write
 *   npm run load:prices -- mygemma-discovered --discovered-only --write
 *   npm run load:listing-images -- mygemma --write
 *   npm run reconcile:sold -- --platform=myGemma --snapshot=data/ingest/_raw/mygemma-live.json --write
 *
 * The feed carries EVERY myGemma product (jewelry, watches, bags), so the same bag gate
 * as the crawl keeps only handbags. Named bags load curated; unnamable live bags bank to
 * discovered_listing (style_guess = title), never a guessed name.
 *
 * SECRET: AWIN_MYGEMMA_FEED_URL is the full Create-a-Feed download URL (it embeds our Awin
 * feed API key). Non-committed — set as a GitHub Actions secret, like TLC's CJ_API_TOKEN.
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { parse } from "csv-parse/sync";
import { canonicalBrand, canonicalModel } from "../../../src/lib/ingest/model-normalize";
import { extractDescriptionFacts, scrubPii } from "../../../src/lib/ingest/description-facts";
import { parsePrice } from "../../../src/lib/ingest/tlc-feed";
import { detectSizeLabel } from "./trr-jsonld";
import { writeObservations } from "../lib/landing";
import type { PriceObservation, SaleCondition } from "../../../src/lib/ingest/types";

const PLATFORM = "myGemma";
const SOURCE = "mygemma";
const RAW_DIR = path.resolve(__dirname, "../../../data/ingest/_raw");
const LIVE_SNAPSHOT = path.join(RAW_DIR, "mygemma-live.json");
const IMAGES_FILE = path.join(RAW_DIR, "mygemma-images.json");

// A Google-format feed row (columns:true). Only the fields we read are typed.
interface FeedRow {
  id?: string;
  title?: string;
  description?: string;
  link?: string;
  image_link?: string;
  brand?: string;
  price?: string;
  sale_price?: string;
  condition?: string;
  availability?: string;
  color?: string;
  product_type?: string;
  google_product_category?: string;
}

// The feed mixes every category; keep only handbags (mirrors the crawl's gate but reads the
// feed's category/type/title). Trailing `s?` matches plurals ("Handbags").
const BAG_TYPE = /\b(bag|handbag|tote|clutch|crossbody|shoulder|satchel|hobo|backpack|bucket|top handle|minaudiere|vanity)s?\b/i;
const NOT_BAG = /\b(shoe|sneaker|pump|heel|flat|sandal|boot|loafer|jewel|jewelry|necklace|earring|bracelet|ring|watch|belt|scarf|sunglass|cufflink|brooch|pendant|charm)s?\b/i;

function isBag(row: FeedRow): boolean {
  const cat = `${row.google_product_category ?? ""} ${row.product_type ?? ""}`.toLowerCase();
  if (cat) {
    if (BAG_TYPE.test(cat)) return true;
    if (NOT_BAG.test(cat)) return false;
  }
  // No usable category → fall back to the title, but never keep an obvious non-bag.
  const title = (row.title ?? "").toLowerCase();
  if (NOT_BAG.test(title) && !BAG_TYPE.test(title)) return false;
  return BAG_TYPE.test(title);
}

/** Fine condition from the free-text description (the Google `condition` field is only
 * new/used); mirrors the grade words myGemma writes ("in excellent condition", …). */
function conditionFromText(text: string | undefined): SaleCondition | null {
  const t = (text ?? "").toLowerCase();
  if (/\bbrand new\b|\bnever (used|worn|carried)\b|\bnew with tag/.test(t)) return "new";
  if (/\blike new\b|\bpristine\b|\bexcellent condition\b|\bexcellent\b/.test(t)) return "excellent";
  if (/\bvery good condition\b|\bvery good\b/.test(t)) return "very good";
  if (/\bgood condition\b|\bgently used\b|\bgood\b/.test(t)) return "good";
  if (/\bfair condition\b|\bfair\b|\bwell[- ]loved\b/.test(t)) return "fair";
  return null;
}

/** The live-for-sale core of a bag row, or null if it isn't a capturable live bag. */
function liveBag(row: FeedRow): { brand: string; price: number; listingRef: string; url: string } | null {
  if (!row.id || !row.title || !row.link || !isBag(row)) return null;
  const avail = (row.availability ?? "").toLowerCase();
  if (avail && !avail.includes("in_stock") && !avail.includes("in stock")) return null;
  // Feed prices look like "1450.00 USD"; sale_price wins when present.
  const priced = parsePrice(row.sale_price || row.price || null);
  if (priced.value == null || priced.value <= 0) return null;
  const brand = canonicalBrand(row.brand ?? "");
  if (!brand) return null;
  // Key on the myGemma SKU (the numeric prefix of the /products/<sku>-… slug), NOT the
  // feed's per-variant id — that's what the crawl banked and what the DB already holds, so
  // the feed UPDATES those rows in place (and reconcile matches them) instead of duplicating
  // every listing under a new ref. Drop the ?variant= query for a canonical source_url.
  const url = row.link.trim().split("?")[0];
  const sku = url.match(/\/products\/(\d+)/)?.[1];
  return { brand, price: priced.value, listingRef: sku ?? row.id.trim(), url };
}

function buildRows(row: FeedRow, today: string): { named?: PriceObservation; discovered?: PriceObservation } {
  const lb = liveBag(row);
  if (!lb) return {};
  const facts = extractDescriptionFacts(`${row.title} ${row.description ?? ""}`);
  const base = {
    brand: lb.brand,
    attrs: {
      size_label: detectSizeLabel(row.title!),
      exterior_colorway: (row.color ?? "").trim() || facts.color || null,
      hardware_color: facts.hardware_finish ?? null,
      condition_detail: (row.description ?? "").trim() ? (scrubPii(row.description!) ?? "").slice(0, 500) || null : null,
      region: "US",
      listing_ref: lb.listingRef,
    },
    platform: PLATFORM,
    price_type: "listed" as const,
    sale_price: lb.price,
    currency: "USD",
    condition: conditionFromText(row.description) ?? conditionFromText(row.condition),
    observed_on: today,
    source_url: lb.url,
    confidence: "high" as const,
    enrichment: {
      ...(row.title ? { source_description: scrubPii(row.title) } : {}),
      ...(Object.values(facts).some((x) => x !== null && x !== false) ? { desc_facts: facts } : {}),
    },
  };
  const style = canonicalModel(lb.brand, row.title);
  if (style) return { named: { ...base, style, notes: `myGemma feed ${today}` } };
  return { discovered: { ...base, style: row.title!, notes: `myGemma feed discovered ${today}` } };
}

async function loadFeed(): Promise<FeedRow[]> {
  const fileArg = process.argv.indexOf("--file");
  let buf: Buffer;
  if (fileArg !== -1 && process.argv[fileArg + 1]) {
    buf = fs.readFileSync(process.argv[fileArg + 1]);
  } else {
    const url = process.env.AWIN_MYGEMMA_FEED_URL;
    if (!url) {
      console.error("Set AWIN_MYGEMMA_FEED_URL (the Awin Create-a-Feed download URL) or pass --file <path>.");
      process.exit(1);
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`feed fetch failed: HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  }
  // The feed is gzip-compressed (.csv.gz); gunzip unless it's already plain CSV.
  const csv = buf[0] === 0x1f && buf[1] === 0x8b ? zlib.gunzipSync(buf).toString("utf8") : buf.toString("utf8");
  return parse(csv, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true, bom: true }) as FeedRow[];
}

async function main() {
  const rows = await loadFeed();
  const today = new Date().toISOString().slice(0, 10);

  const named: PriceObservation[] = [];
  const discovered: PriceObservation[] = [];
  const images: { listing_ref: string; image_url: string }[] = [];
  const liveRefs: string[] = [];

  for (const row of rows) {
    const { named: n, discovered: d } = buildRows(row, today);
    const obs = n ?? d;
    if (!obs) continue;
    if (n) named.push(n);
    if (d) discovered.push(d);
    liveRefs.push(obs.attrs.listing_ref as string);
    const img = (row.image_link ?? "").trim();
    if (img && /^https?:\/\//.test(img)) images.push({ listing_ref: obs.attrs.listing_ref as string, image_url: img });
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(LIVE_SNAPSHOT, JSON.stringify([...new Set(liveRefs)]));
  fs.writeFileSync(IMAGES_FILE, JSON.stringify(images));

  const res = writeObservations(SOURCE, named);
  const disc = writeObservations(`${SOURCE}-discovered`, discovered);
  console.log(`myGemma (Awin feed): ${rows.length} feed rows -> ${named.length} named, ${discovered.length} discovered bags, ${images.length} images`);
  console.log(`  named landing: kept ${res.kept}, dropped ${res.dropped} -> ${res.file}`);
  console.log(`  discovered landing: kept ${disc.kept}, dropped ${disc.dropped} -> ${disc.file}`);
  console.log(`  live snapshot -> ${LIVE_SNAPSHOT} (${new Set(liveRefs).size} refs); images -> ${IMAGES_FILE}`);
}

main().catch((e) => {
  console.error("[mygemma-awin] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
