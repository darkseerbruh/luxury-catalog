/**
 * Redeluxe source adapter — maps the crawled Shopify raw dump into PriceObservations.
 *
 *   npx tsx supabase/ingest/sources/redeluxe-crawl.ts        # refresh data/ingest/_raw/redeluxe.json
 *   npx tsx supabase/ingest/sources/redeluxe.ts --raw        # dump -> landing observations
 *   npm run load:prices -- redeluxe --write                  # resolve + upsert into price_history
 *   npm run reconcile:sold -- --platform=Redeluxe --snapshot=data/ingest/_raw/redeluxe-live.json --write
 *
 * Redeluxe's feed is clean: `vendor` = house, `title` = model + size + colour + material +
 * hardware, `tags` carry the condition grade, and the first variant carries price + sku +
 * availability. We resolve the model with the shared canonicalModel() (same resolver TLC
 * uses) and keep ONLY rows we can name — unnamable bags are the discovered-listing follow-up,
 * never a guessed identity. Stated facts (colour/material/hardware) are mined via
 * extractDescriptionFacts; nothing verbatim is served.
 */
import fs from "fs";
import path from "path";
import { canonicalBrand, canonicalModel } from "../../../src/lib/ingest/model-normalize";
import { extractDescriptionFacts, scrubPii } from "../../../src/lib/ingest/description-facts";
import { detectSizeLabel } from "./trr-jsonld";
import { writeObservations } from "../lib/landing";
import type { PriceObservation, SaleCondition } from "../../../src/lib/ingest/types";

const PLATFORM = "Redeluxe";
const SOURCE = "redeluxe";
const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/redeluxe.json");

interface ShopifyVariant { price?: string; available?: boolean; sku?: string }
interface RawDumpEntry {
  product: {
    title?: string; handle?: string; vendor?: string; product_type?: string;
    tags?: string[]; variants?: ShopifyVariant[];
  };
  url?: string;
}

// Redeluxe's product_type / tags mark bags; drop accessories so SLGs/shoes/jewellery
// never enter the pipeline. Bag-ish types pass, an accessory word anywhere vetoes.
// Trailing `s?` matches plural product_types ("Handbags"): \bhandbag\b would miss the "s".
const BAG_TYPE = /\b(bag|handbag|tote|clutch|crossbody|cross body|shoulder|satchel|hobo|backpack|bucket|saddle|boston|top handle|minaudiere|vanity)s?\b/i;
const NOT_BAG = /\b(wallet|card holder|cardholder|belt|scarf|shoe|sneaker|boot|sandal|pump|loafer|sunglass|necklace|earring|bracelet|ring|watch|charm|keychain|perfume|shawl|twilly)s?\b/i;

function isBag(p: RawDumpEntry["product"]): boolean {
  const type = (p.product_type ?? "").toLowerCase();
  const tagline = (p.tags ?? []).join(" ").toLowerCase();
  if (NOT_BAG.test(type)) return false;
  return BAG_TYPE.test(type) || BAG_TYPE.test(tagline);
}

// Redeluxe grades live in the tags. Map to our SaleCondition ladder; pristine reads as
// like-new, which is our "excellent" (never "new" — these are pre-owned). Unknown → null
// (never guess a grade).
function conditionFromTags(tags: string[] | undefined): SaleCondition | null {
  const set = new Set((tags ?? []).map((t) => t.toLowerCase().trim()));
  if (set.has("pristine") || set.has("excellent")) return "excellent";
  if (set.has("very good")) return "very good";
  if (set.has("good")) return "good";
  if (set.has("fair")) return "fair";
  if (set.has("new") || set.has("unused")) return "new";
  return null;
}

/** The live-for-sale core of a bag listing, or null if it isn't a capturable live bag. */
function liveBag(entry: RawDumpEntry): { p: RawDumpEntry["product"]; brand: string; price: number; listingRef: string | null } | null {
  const p = entry.product;
  if (!p.title || !entry.url || !isBag(p)) return null;
  const v = (p.variants ?? [])[0] ?? {};
  if (v.available !== true) return null; // only what's actually for sale right now
  const price = Number.parseFloat(v.price ?? "");
  if (!Number.isFinite(price) || price <= 0) return null;
  const brand = canonicalBrand(p.vendor ?? "");
  if (!brand) return null;
  return { p, brand, price, listingRef: (v.sku ?? "").trim() || p.handle || null };
}

/**
 * One live bag → a NAMED observation (canonicalModel resolved the style) OR a DISCOVERED
 * one (unnamable: style = the raw title as evidence, loaded with --discovered-only so it's
 * never loose-matched onto a curated variant). Nothing is thrown away.
 */
function buildRows(entry: RawDumpEntry, today: string): { named?: PriceObservation; discovered?: PriceObservation } {
  const lb = liveBag(entry);
  if (!lb) return {};
  const facts = extractDescriptionFacts(lb.p.title!);
  const base = {
    brand: lb.brand,
    attrs: {
      size_label: detectSizeLabel(lb.p.title!),
      exterior_colorway: facts.color ?? null,
      // Exterior material (Togo/Swift/Epsom…) isn't reliably parseable from the title;
      // the full title rides in source_description for the LLM enrich pass to mine.
      hardware_color: facts.hardware_finish ?? null,
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
    enrichment: {
      ...(lb.p.title ? { source_description: scrubPii(lb.p.title) } : {}),
      ...(Object.values(facts).some((x) => x !== null && x !== false) ? { desc_facts: facts } : {}),
    },
  };
  const style = canonicalModel(lb.brand, lb.p.title);
  if (style) return { named: { ...base, style, notes: `Redeluxe crawl ${today}` } };
  return { discovered: { ...base, style: lb.p.title!, notes: `Redeluxe discovered ${today}` } };
}

function main() {
  if (!process.argv.includes("--raw")) {
    console.error("usage: redeluxe.ts --raw   (reads data/ingest/_raw/redeluxe.json)");
    process.exit(1);
  }
  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`no raw dump at ${RAW_DUMP} — run redeluxe-crawl.ts first`);
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
  console.log(`Redeluxe: ${dump.length} listings -> ${named.length} named, ${discovered.length} discovered (unnamed live bags)`);
  console.log(`  named landing: kept ${res.kept}, dropped ${res.dropped} -> ${res.file}`);
  console.log(`  discovered landing: kept ${disc.kept}, dropped ${disc.dropped} -> ${disc.file}`);
}

main();
