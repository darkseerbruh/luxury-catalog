/**
 * Ann's Fabulous Finds source adapter — maps the crawled Shopify raw dump into
 * PriceObservations.
 *
 *   npx tsx supabase/ingest/sources/anns-crawl.ts           # refresh data/ingest/_raw/anns.json
 *   npx tsx supabase/ingest/sources/anns.ts --raw           # dump -> landing observations
 *   npm run load:prices -- anns --write                     # resolve + upsert into price_history
 *   npm run load:prices -- anns-discovered --discovered-only --write
 *   npm run reconcile:sold -- --platform="Ann's Fabulous Finds" --snapshot=data/ingest/_raw/anns-live.json --write
 *
 * Ann's sells shoes/jewellery too, so we gate on bag `product_type`s. Brand from `vendor`
 * (real houses), model via the shared canonicalModel(), colour mined from the title. Ann's
 * feed carries no grade tag, so condition stays null (never guessed). Named bags load curated;
 * unnamable live bags bank to discovered_listing (style_guess = title), never a guessed name.
 */
import fs from "fs";
import path from "path";
import { canonicalBrand, canonicalModel } from "../../../src/lib/ingest/model-normalize";
import { extractDescriptionFacts, scrubPii } from "../../../src/lib/ingest/description-facts";
import { detectSizeLabel } from "./trr-jsonld";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";

const PLATFORM = "Ann's Fabulous Finds";
const SOURCE = "anns";
const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/anns.json");

interface ShopifyVariant { price?: string; available?: boolean; sku?: string }
interface RawDumpEntry {
  product: {
    title?: string; handle?: string; vendor?: string; product_type?: string;
    tags?: string[]; variants?: ShopifyVariant[];
  };
  url?: string;
}

// Ann's product_type is a clean category (Handbags / Accessories / Shoes / Jewelry). Keep bag
// categories only; an accessory/footwear/jewellery word vetoes.
// Trailing `s?` matches plural product_types ("Handbags"): \bhandbag\b would miss the "s".
const BAG_TYPE = /\b(bag|handbag|tote|clutch|crossbody|shoulder|satchel|hobo|backpack|bucket|top handle|minaudiere|vanity)s?\b/i;
const NOT_BAG = /\b(shoe|sneaker|pump|heel|flat|sandal|boot|loafer|jewel|jewelry|necklace|earring|bracelet|ring|watch|belt|scarf|sunglass|wallet|charm)s?\b/i;

function isBag(p: RawDumpEntry["product"]): boolean {
  const type = (p.product_type ?? "").toLowerCase();
  if (!type) return false;
  if (NOT_BAG.test(type)) return false;
  return BAG_TYPE.test(type);
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
  const facts = extractDescriptionFacts(lb.p.title!);
  const base = {
    brand: lb.brand,
    attrs: {
      size_label: detectSizeLabel(lb.p.title!),
      exterior_colorway: facts.color ?? null,
      hardware_color: facts.hardware_finish ?? null,
      region: "US",
      listing_ref: lb.listingRef,
    },
    platform: PLATFORM,
    price_type: "listed" as const,
    sale_price: lb.price,
    currency: "USD",
    condition: null, // Ann's feed carries no grade tag; never guess one
    observed_on: today,
    source_url: entry.url!,
    confidence: "high" as const,
    enrichment: {
      ...(lb.p.title ? { source_description: scrubPii(lb.p.title) } : {}),
      ...(Object.values(facts).some((x) => x !== null && x !== false) ? { desc_facts: facts } : {}),
    },
  };
  const style = canonicalModel(lb.brand, lb.p.title);
  if (style) return { named: { ...base, style, notes: `Ann's Fabulous Finds crawl ${today}` } };
  return { discovered: { ...base, style: lb.p.title!, notes: `Ann's Fabulous Finds discovered ${today}` } };
}

function main() {
  if (!process.argv.includes("--raw")) {
    console.error("usage: anns.ts --raw   (reads data/ingest/_raw/anns.json)");
    process.exit(1);
  }
  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`no raw dump at ${RAW_DUMP} — run anns-crawl.ts first`);
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
  console.log(`Ann's Fabulous Finds: ${dump.length} listings -> ${named.length} named, ${discovered.length} discovered (unnamed live bags)`);
  console.log(`  named landing: kept ${res.kept}, dropped ${res.dropped} -> ${res.file}`);
  console.log(`  discovered landing: kept ${disc.kept}, dropped ${disc.dropped} -> ${disc.file}`);
}

main();
