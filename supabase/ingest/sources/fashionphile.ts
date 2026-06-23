/**
 * Fashionphile source adapter — two modes:
 *
 * MODE A — browser raw-dump (high-confidence, per-listing):
 *   Fashionphile runs on Shopify. In Chrome, fetch individual product JSONs via
 *   the same-origin endpoint:
 *     fetch('/products/<handle>.json').then(r=>r.json())
 *   Collect the records (with optional condition grade from the card) and save as:
 *     data/ingest/_raw/fashionphile.json
 *   Shape of each element:
 *     { product: ShopifyProduct, url: string, conditionGrade?: string }
 *   Then run:
 *     npx tsx supabase/ingest/sources/fashionphile.ts --raw
 *   Each record maps through parseFashionphileProduct(product, conditionGrade)
 *   → PriceObservation with confidence:"high", price_type:"listed", source_url per listing.
 *
 * Condition grades Fashionphile uses (capture from the listing card):
 *   "New" | "Giftable" | "Excellent" | "Very Good" | "Good" | "Fair"
 *   Mapped to SaleCondition by mapFashionphileCondition().
 *
 * MODE B — live page scrape (medium-confidence, search-page summary):
 *   npm run ingest:fashionphile   (no flag)
 *   Reads the search/listing page, finds the lowest in-band price for the style
 *   as a single representative observation. Page is JS-rendered so this often
 *   returns nothing; the raw-dump path is strongly preferred.
 *
 * Legal / attribution posture: prices are facts; every row carries source_url.
 * Never ingest product photos or verbatim descriptions.
 */
import fs from "fs";
import path from "path";
import { stripTags } from "../../../src/lib/ingest/html";
import { parseAllPrices } from "../../../src/lib/ingest/price-extract";
import { parseFashionphileProduct } from "../../../src/lib/ingest/fashionphile";
import type { ShopifyProduct } from "../../../src/lib/ingest/fashionphile";
import { politeFetchText } from "../lib/fetch";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";

const PLATFORM = "Fashionphile";
const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/fashionphile.json");

// ---------------------------------------------------------------------------
// TARGETS — one entry per catalog variant we want to capture.
// Each target maps incoming Shopify product records to a known brand/style/size.
// ---------------------------------------------------------------------------

interface FashionphileTarget {
  brand: string;
  style: string;
  size_label: string;
  /** Tokens that must ALL appear (case-insensitive) in the product handle or title. */
  requireTokens: string[];
  minPrice: number;
  maxPrice: number;
  /** Search/listing page URL — used for fallback scrape + as source_url for search-level rows. */
  searchUrl: string;
}

const TARGETS: FashionphileTarget[] = [
  {
    brand: "Chanel",
    style: "Classic Flap",
    size_label: "Medium",
    // Fashionphile names it "Medium Double Flap" (handle: chanel-...-medium-double-flap-...),
    // not "Classic Flap" — match on that.
    requireTokens: ["chanel", "double-flap", "medium"],
    minPrice: 1500,
    maxPrice: 25000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  },
];

// ---------------------------------------------------------------------------
// MODE A — browser raw-dump (high confidence, per listing)
// ---------------------------------------------------------------------------

/**
 * Shape of one element in the raw dump.
 * `conditionGrade` is optional — capture it from the listing card in the browser
 * (the grade text appears as "Condition: Excellent" on search/product cards).
 * Fashionphile grades: "New" | "Giftable" | "Excellent" | "Very Good" | "Good" | "Fair"
 */
interface RawDumpEntry {
  product: ShopifyProduct;
  /** Canonical listing URL — must be captured alongside the product JSON. */
  url?: string;
  /**
   * Optional condition grade from the listing/search card.
   * Not present in the Shopify product JSON; must be captured from the page.
   * Example: "Excellent", "Very Good", "Giftable"
   */
  conditionGrade?: string | null;
}

/**
 * Map a raw Shopify product JSON record to a PriceObservation.
 * Returns null if the record can't be matched to a target or price is absent.
 */
function mapRawRecord(entry: RawDumpEntry, today: string): PriceObservation | null {
  const { product, url, conditionGrade } = entry;
  if (!url) {
    console.warn("fashionphile: raw record missing url — skipping (url is required for attribution)");
    return null;
  }

  const handle = (product.handle ?? "").toLowerCase();
  const title = (product.title ?? "").toLowerCase();

  const target = TARGETS.find((t) =>
    t.requireTokens.every((tok) => handle.includes(tok) || title.includes(tok))
  );
  if (!target) {
    console.warn(`fashionphile: no target matched for handle "${product.handle}" — skipping`);
    return null;
  }

  // Pass conditionGrade so parseFashionphileProduct can map it to a SaleCondition.
  const spec = parseFashionphileProduct(product, conditionGrade);
  if (!spec.price) {
    console.warn(`fashionphile: no price parsed for "${product.handle}" — skipping`);
    return null;
  }
  if (spec.price < target.minPrice || spec.price > target.maxPrice) {
    console.warn(`fashionphile: price ${spec.price} out of band [${target.minPrice}–${target.maxPrice}] for "${product.handle}" — skipping`);
    return null;
  }

  return {
    brand: target.brand,
    style: target.style,
    attrs: {
      size_label: target.size_label,
      exterior_colorway: spec.color,
      exterior_material: spec.material,
      hardware_color: spec.hardwareColor,
      production_year: spec.productionYear,
      season: spec.season,
      inclusions: spec.inclusions,
      listing_ref: spec.sku,
    },
    platform: PLATFORM,
    price_type: "listed",
    sale_price: spec.price,
    currency: spec.currency,
    condition: spec.condition,
    observed_on: today,
    source_url: url,
    confidence: "high",
    notes: product.title?.slice(0, 160) ?? null,
  };
}

function ingestFromRawDump(): void {
  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`fashionphile --raw: dump not found at ${RAW_DUMP}`);
    console.error("Capture step: in Chrome on fashionphile.com, follow docs/research-drafts/fashionphile-capture.md.");
    console.error("Quick version — for each handle, fetch `/products/<handle>.json`, then save:");
    console.error("  [{product: <shopify-product-obj>, url: 'https://www.fashionphile.com/products/<handle>', conditionGrade: 'Excellent'}]");
    console.error("to data/ingest/_raw/fashionphile.json, then re-run with --raw.");
    process.exit(1);
  }
  const raw: RawDumpEntry[] = JSON.parse(fs.readFileSync(RAW_DUMP, "utf8"));
  const today = new Date().toISOString().slice(0, 10);
  const obs: PriceObservation[] = raw
    .map((e) => mapRawRecord(e, today))
    .filter((o): o is PriceObservation => o !== null);

  const { file, kept, dropped } = writeObservations("fashionphile", obs);
  console.log(`fashionphile (raw): ${raw.length} records, ${kept} kept${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

// ---------------------------------------------------------------------------
// MODE B — live search-page scrape (medium confidence, single search-level row)
// ---------------------------------------------------------------------------

interface ResellerSearchTarget {
  brand: string;
  style: string;
  size_label?: string;
  url: string;
  minPrice: number;
  maxPrice: number;
}

const SEARCH_TARGETS: ResellerSearchTarget[] = TARGETS.map((t) => ({
  brand: t.brand,
  style: t.style,
  size_label: t.size_label,
  url: t.searchUrl,
  minPrice: t.minPrice,
  maxPrice: t.maxPrice,
}));

async function ingestSearchTarget(t: ResellerSearchTarget): Promise<PriceObservation | null> {
  const text = stripTags(await politeFetchText(t.url));
  const prices = parseAllPrices(text)
    .map((p) => p.amount)
    .filter((a) => a >= t.minPrice && a <= t.maxPrice);
  if (prices.length === 0) {
    console.warn(`fashionphile: no in-band prices for ${t.brand} ${t.style} (page may need JS / selector tuning)`);
    return null;
  }
  const amount = Math.min(...prices);
  return {
    brand: t.brand,
    style: t.style,
    attrs: { size_label: t.size_label },
    platform: PLATFORM,
    price_type: "listed",
    sale_price: amount,
    currency: "USD",
    observed_on: new Date().toISOString().slice(0, 10),
    source_url: t.url,
    confidence: "medium",
    notes: `current entry price; min of ${prices.length} in-band listings`,
  };
}

async function ingestFromSearchPages(): Promise<void> {
  const out: PriceObservation[] = [];
  for (const t of SEARCH_TARGETS) {
    const obs = await ingestSearchTarget(t);
    if (obs) out.push(obs);
  }
  const { file, kept, dropped } = writeObservations("fashionphile", out);
  console.log(`fashionphile: wrote ${kept} observation(s)${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const useRaw = process.argv.includes("--raw");
  if (useRaw) {
    ingestFromRawDump();
  } else {
    await ingestFromSearchPages();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
