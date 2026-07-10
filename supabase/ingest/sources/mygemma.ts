/**
 * myGemma source adapter — maps the crawled handbags-collection dump into PriceObservations.
 *
 *   npx tsx supabase/ingest/sources/mygemma-crawl.ts        # refresh data/ingest/_raw/mygemma.json
 *   npx tsx supabase/ingest/sources/mygemma.ts --raw        # dump -> landing observations
 *   npm run load:prices -- mygemma --write
 *   npm run load:prices -- mygemma-discovered --discovered-only --write
 *   npm run reconcile:sold -- --platform=myGemma --snapshot=data/ingest/_raw/mygemma-live.json --write
 *
 * myGemma's handbags feed is the richest free source: brand from `vendor`, model via the shared
 * canonicalModel(), colour from the title, AND both a condition GRADE (`Condition Type_<X>`) and
 * a full condition WRITE-UP (`Condition Description_…`) in the tags. Named bags load curated;
 * unnamable live bags bank to discovered_listing (style_guess = title), never a guessed name.
 */
import fs from "fs";
import path from "path";
import { canonicalBrand, canonicalModel } from "../../../src/lib/ingest/model-normalize";
import { extractDescriptionFacts, scrubPii } from "../../../src/lib/ingest/description-facts";
import { detectSizeLabel } from "./trr-jsonld";
import { writeObservations } from "../lib/landing";
import type { PriceObservation, SaleCondition } from "../../../src/lib/ingest/types";

const PLATFORM = "myGemma";
const SOURCE = "mygemma";
const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/mygemma.json");

interface ShopifyVariant { price?: string; available?: boolean; sku?: string }
interface RawDumpEntry {
  product: {
    title?: string; handle?: string; vendor?: string; product_type?: string;
    tags?: string[]; variants?: ShopifyVariant[];
  };
  url?: string;
}

// Crawled from /collections/handbags, but keep a bag gate anyway (belt-and-braces). Trailing
// `s?` matches plural product_types ("Handbags").
const BAG_TYPE = /\b(bag|handbag|tote|clutch|crossbody|shoulder|satchel|hobo|backpack|bucket|top handle|minaudiere|vanity)s?\b/i;
const NOT_BAG = /\b(shoe|sneaker|pump|heel|flat|sandal|boot|loafer|jewel|jewelry|necklace|earring|bracelet|ring|watch|belt|scarf|sunglass|wallet|charm)s?\b/i;

function isBag(p: RawDumpEntry["product"]): boolean {
  const type = (p.product_type ?? "").toLowerCase();
  if (!type) return true; // collection feed is bags; missing type shouldn't drop a bag
  if (NOT_BAG.test(type)) return false;
  return BAG_TYPE.test(type);
}

/** First value of a "Prefix_<value>" tag (case-insensitive prefix). */
function tagValue(tags: string[] | undefined, prefix: string): string | null {
  const re = new RegExp(`^${prefix}`, "i");
  for (const t of tags ?? []) {
    if (re.test(t.trim())) return t.trim().replace(re, "").trim() || null;
  }
  return null;
}

function conditionFromTags(tags: string[] | undefined): SaleCondition | null {
  const grade = (tagValue(tags, "Condition Type_") ?? tagValue(tags, "Editorialist_Condition_") ?? "")
    .toLowerCase().replace(/_/g, " ").trim();
  if (grade.includes("new")) return "new";
  if (grade.includes("like new") || grade.includes("pristine")) return "excellent";
  if (grade.includes("excellent")) return "excellent";
  if (grade.includes("very good")) return "very good";
  if (grade.includes("good")) return "good";
  if (grade.includes("fair")) return "fair";
  return null;
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
 * One live bag → a NAMED observation (canonicalModel resolved) OR a DISCOVERED one (unnamable:
 * style = the raw title, --discovered-only so it never loose-matches a curated variant).
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
      condition_detail: tagValue(lb.p.tags, "Condition Description_"),
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
  if (style) return { named: { ...base, style, notes: `myGemma crawl ${today}` } };
  return { discovered: { ...base, style: lb.p.title!, notes: `myGemma discovered ${today}` } };
}

function main() {
  if (!process.argv.includes("--raw")) {
    console.error("usage: mygemma.ts --raw   (reads data/ingest/_raw/mygemma.json)");
    process.exit(1);
  }
  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`no raw dump at ${RAW_DUMP} — run mygemma-crawl.ts first`);
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
  console.log(`myGemma: ${dump.length} listings -> ${named.length} named, ${discovered.length} discovered (unnamed live bags)`);
  console.log(`  named landing: kept ${res.kept}, dropped ${res.dropped} -> ${res.file}`);
  console.log(`  discovered landing: kept ${disc.kept}, dropped ${disc.dropped} -> ${disc.file}`);
}

main();
