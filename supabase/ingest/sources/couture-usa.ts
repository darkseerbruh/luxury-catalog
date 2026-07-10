/**
 * Couture USA source adapter — maps the crawled Shopify raw dump into PriceObservations.
 *
 *   npx tsx supabase/ingest/sources/couture-usa-crawl.ts     # refresh data/ingest/_raw/couture-usa.json
 *   npx tsx supabase/ingest/sources/couture-usa.ts --raw     # dump -> landing observations
 *   npm run load:prices -- couture-usa --write               # resolve + upsert into price_history
 *   npm run reconcile:sold -- --platform="Couture USA" --snapshot=data/ingest/_raw/couture-usa-live.json --write
 *
 * Couture USA sells shoes too, so we gate on bag `product_type`s. Brand comes from `vendor`,
 * the model from the shared canonicalModel() (keep only what we can name — unnamable bags are
 * the discovered-listing follow-up, never a guessed identity), condition from the grade tags
 * (Like New / Excellent / Great / Very Good / Good / Fair), and colour from the `Color_*` tags.
 */
import fs from "fs";
import path from "path";
import { canonicalBrand, canonicalModel } from "../../../src/lib/ingest/model-normalize";
import { detectSizeLabel } from "./trr-jsonld";
import { writeObservations } from "../lib/landing";
import type { PriceObservation, SaleCondition } from "../../../src/lib/ingest/types";

const PLATFORM = "Couture USA";
const SOURCE = "couture-usa";
const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/couture-usa.json");

interface ShopifyVariant { price?: string; available?: boolean; sku?: string }
interface RawDumpEntry {
  product: {
    title?: string; handle?: string; vendor?: string; product_type?: string;
    tags?: string[]; variants?: ShopifyVariant[];
  };
  url?: string;
}

// Couture USA's product_type is a clean category. Keep bag categories, drop footwear /
// accessories so only handbags enter the pipeline.
// Trailing `s?` matches plural product_types ("Handbags"): \bbag\b would miss the "s".
const BAG_TYPE = /\b(bag|tote|clutch|crossbody|shoulder|satchel|hobo|backpack|bucket|top handle|minaudiere|vanity|wristlet)s?\b/i;
const NOT_BAG = /\b(sneaker|pump|heel|flat|sandal|wedge|boot|loafer|mule|espadrille|shoe|wallet|belt|scarf|sunglass|jewel|necklace|earring|bracelet|ring|watch|charm|hat|sole)s?\b/i;

function isBag(p: RawDumpEntry["product"]): boolean {
  const type = (p.product_type ?? "").toLowerCase();
  if (!type) return false;
  if (NOT_BAG.test(type)) return false;
  return BAG_TYPE.test(type);
}

// Grades live in the tags, as bare words (EXCELLENT) and/or "Star N – Label". Scan the joined
// tag text in priority order, highest first. Like New reads as our top pre-owned grade
// "excellent" (never "new" — these are consigned). Order guards substrings ("very good"
// before "good", "like new" before "new").
function conditionFromTags(tags: string[] | undefined): SaleCondition | null {
  const t = (tags ?? []).join(" | ").toLowerCase();
  if (/\blike new\b/.test(t) || /\bpristine\b/.test(t)) return "excellent";
  if (/\bexcellent\b/.test(t)) return "excellent";
  if (/\bgreat\b/.test(t)) return "very good"; // Star 3.5, below Excellent
  if (/\bvery good\b/.test(t)) return "very good";
  if (/\bgood\b/.test(t)) return "good";
  if (/\bfair\b/.test(t)) return "fair";
  if (/\bnew\b/.test(t)) return "new";
  return null;
}

// Colour is a structured tag: "Color_Pink". Multiple = multi-colour; join in listing order.
function colourFromTags(tags: string[] | undefined): string | null {
  const cols = (tags ?? [])
    .filter((t) => /^color_/i.test(t.trim()))
    .map((t) => t.trim().replace(/^color_/i, "").trim())
    .filter(Boolean);
  return cols.length ? [...new Set(cols)].join("/") : null;
}

/** The live-for-sale core of a bag listing, or null if it isn't a capturable live bag. */
function liveBag(entry: RawDumpEntry): { p: RawDumpEntry["product"]; brand: string; price: number; listingRef: string | null } | null {
  const p = entry.product;
  if (!p.title || !entry.url || !isBag(p)) return null;
  const v = (p.variants ?? [])[0] ?? {};
  if (v.available !== true) return null;
  const price = Number.parseFloat(v.price ?? "");
  if (!Number.isFinite(price) || price <= 0) return null;
  const brand = canonicalBrand(p.vendor ?? "");
  if (!brand) return null;
  return { p, brand, price, listingRef: (v.sku ?? "").trim() || p.handle || null };
}

/**
 * One live bag → a NAMED observation (canonicalModel resolved) OR a DISCOVERED one
 * (unnamable: style = the raw title as evidence, loaded with --discovered-only so it's never
 * loose-matched onto a curated variant). Nothing is thrown away.
 */
function buildRows(entry: RawDumpEntry, today: string): { named?: PriceObservation; discovered?: PriceObservation } {
  const lb = liveBag(entry);
  if (!lb) return {};
  const base = {
    brand: lb.brand,
    attrs: {
      size_label: detectSizeLabel(lb.p.title!),
      exterior_colorway: colourFromTags(lb.p.tags),
      region: "US",
      listing_ref: lb.listingRef,
    },
    platform: PLATFORM,
    price_type: "listed" as const,
    sale_price: lb.price,
    currency: "USD",
    condition: conditionFromTags(lb.p.tags),
    observed_on: today,
    source_url: entry.url!,
    confidence: "high" as const,
  };
  const style = canonicalModel(lb.brand, lb.p.title);
  if (style) return { named: { ...base, style, notes: `Couture USA crawl ${today}` } };
  return { discovered: { ...base, style: lb.p.title!, notes: `Couture USA discovered ${today}` } };
}

function main() {
  if (!process.argv.includes("--raw")) {
    console.error("usage: couture-usa.ts --raw   (reads data/ingest/_raw/couture-usa.json)");
    process.exit(1);
  }
  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`no raw dump at ${RAW_DUMP} — run couture-usa-crawl.ts first`);
    process.exit(1);
  }
  const dump: RawDumpEntry[] = JSON.parse(fs.readFileSync(RAW_DUMP, "utf8"));
  const today = new Date().toISOString().slice(0, 10);

  const named: PriceObservation[] = [];
  const discovered: PriceObservation[] = [];
  for (const entry of dump) {
    const { named: n, discovered: d } = buildRows(entry, today);
    if (n) named.push(n);
    if (d) discovered.push(d);
  }

  const res = writeObservations(SOURCE, named);
  const disc = writeObservations(`${SOURCE}-discovered`, discovered);
  console.log(`Couture USA: ${dump.length} listings -> ${named.length} named, ${discovered.length} discovered (unnamed live bags)`);
  console.log(`  named landing: kept ${res.kept}, dropped ${res.dropped} -> ${res.file}`);
  console.log(`  discovered landing: kept ${disc.kept}, dropped ${disc.dropped} -> ${disc.file}`);
}

main();
