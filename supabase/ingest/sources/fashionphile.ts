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
  /**
   * Optional tokens that must NOT appear (case-insensitive) in handle or title.
   * Used to keep a style's size buckets clean of adjacent products that share the
   * style name — e.g. the Chanel "Boy" flap bag vs. Boy-line accessories (Wallet on
   * Chain, bucket bag, cosmetic case, card holder) that also carry "boy" in the name.
   */
  excludeTokens?: string[];
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
  // Hero bags — Fashionphile handles: hermes-<leather>-birkin-<size>-, ...-kelly-<size>-,
  // louis-vuitton-...-neverfull-<mm|pm>, gucci-...-matelasse-<small|medium>-gg-marmont-...
  { brand: "Hermès", style: "Birkin", size_label: "25", requireTokens: ["hermes", "birkin-25"], minPrice: 8000, maxPrice: 120000, searchUrl: "https://www.fashionphile.com/collections/hermes/products.json" },
  { brand: "Hermès", style: "Birkin", size_label: "30", requireTokens: ["hermes", "birkin-30"], minPrice: 8000, maxPrice: 120000, searchUrl: "https://www.fashionphile.com/collections/hermes/products.json" },
  { brand: "Hermès", style: "Birkin", size_label: "35", requireTokens: ["hermes", "birkin-35"], minPrice: 8000, maxPrice: 120000, searchUrl: "https://www.fashionphile.com/collections/hermes/products.json" },
  { brand: "Hermès", style: "Kelly", size_label: "28", requireTokens: ["hermes", "kelly-28"], minPrice: 7000, maxPrice: 100000, searchUrl: "https://www.fashionphile.com/collections/hermes/products.json" },
  { brand: "Hermès", style: "Kelly", size_label: "32", requireTokens: ["hermes", "kelly-32"], minPrice: 7000, maxPrice: 100000, searchUrl: "https://www.fashionphile.com/collections/hermes/products.json" },
  { brand: "Louis Vuitton", style: "Neverfull", size_label: "MM", requireTokens: ["neverfull-mm"], minPrice: 500, maxPrice: 8000, searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json" },
  { brand: "Louis Vuitton", style: "Neverfull", size_label: "PM", requireTokens: ["neverfull-pm"], minPrice: 500, maxPrice: 8000, searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json" },
  { brand: "Gucci", style: "GG Marmont", size_label: "Small", requireTokens: ["gg-marmont", "small"], minPrice: 400, maxPrice: 5000, searchUrl: "https://www.fashionphile.com/collections/gucci/products.json" },
  { brand: "Gucci", style: "GG Marmont", size_label: "Medium", requireTokens: ["gg-marmont", "medium"], minPrice: 400, maxPrice: 5000, searchUrl: "https://www.fashionphile.com/collections/gucci/products.json" },
  // Chanel Boy (backbone Tier-1). Fashionphile titles it "<material> ... <size> Boy Flap <colour>"
  // (New/Old Medium both fold to Medium). excludeTokens drop the Boy-LINE accessories that share
  // the name (WOC/wallet, bucket bag, cosmetic/vanity case, card holder, mini pochette, brick).
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Chanel",
    style: "Boy",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["boy", size],
    excludeTokens: ["woc", "wallet", "bucket", "cosmetic", "vanity", "card", "coin", "pochette", "brick", "backpack", "key"],
    minPrice: 1000,
    maxPrice: 20000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),
  // Gucci Jackie 1961 (backbone Tier-1). Fashionphile handle: gucci-...-jackie-1961-<size>-.
  // excludeTokens drop Jackie-line small leather goods (wallet/card/coin/pouch).
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Gucci",
    style: "Jackie 1961",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["jackie", size],
    excludeTokens: ["wallet", "card", "coin", "pouch", "continental"],
    minPrice: 400,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),
  // Celine Luggage (backbone Tier-1, canonical "Luggage Tote"). excludeTokens drop the
  // Luggage PHANTOM sub-model (open-side, distinct) + small leather goods.
  ...(["nano", "micro", "mini", "medium"] as const).map((size) => ({
    brand: "Celine",
    style: "Luggage Tote",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["luggage", size],
    excludeTokens: ["phantom", "wallet", "card", "pouch"],
    minPrice: 400,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  })),
  // Saint Laurent Loulou (backbone Tier-1). excludeTokens drop the Loulou PUFFER sub-line
  // (distinct quilted puffer) + small leather goods.
  ...(["toy", "small", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Loulou",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["loulou", size],
    excludeTokens: ["puffer", "wallet", "card", "pouch", "toy-puffer"],
    minPrice: 400,
    maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // WIDE BATCH 2026-06-23 — go-wide Tier-1 backbone icons (Fashionphile, no browser).
  // Each block validated against the live collection JSON: requireTokens anchor the
  // size in the handle (e.g. "constance-18"), excludeTokens drop SLGs / sub-models /
  // non-bags that share the style name. Price bands keep real outliers in band while
  // letting token-excluded accessories drop. Brand/style names match the canonical
  // backbone catalog rows so the loader resolves to the clean style.
  // ════════════════════════════════════════════════════════════════════════════

  // Hermès Constance (#411) — sizes 18 / 24. The size is anchored in the handle
  // ("constance-18"); price ≥ $6k drops the Constance Slim/To-Go/Long wallets, and
  // excludeTokens drop the elongated Élan sub-model.
  ...(["18", "24"] as const).map((size) => ({
    brand: "Hermès",
    style: "Constance",
    size_label: size,
    requireTokens: [`constance-${size}`],
    excludeTokens: ["wallet", "slim", "to-go", "compact", "elan", "belt", "long"],
    minPrice: 6000,
    maxPrice: 45000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),

  // Chanel 19 (#425) — sizes Small / Medium / Large / Maxi. Handle: "chanel-19-flap".
  // excludeTokens drop the 19 WOC / card holder / phone holder accessories.
  ...(["small", "medium", "large", "maxi"] as const).map((size) => ({
    brand: "Chanel",
    style: "Chanel 19",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["19-flap", size],
    excludeTokens: ["woc", "wallet", "card", "coin", "phone", "holder", "pouch"],
    minPrice: 2500,
    maxPrice: 15000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),

  // Chanel Gabrielle (#426) — sizes Small / Medium / Large (hobo + structured). The
  // size sits before the model in the handle ("...quilted-medium-gabrielle-hobo").
  // excludeTokens drop the Gabrielle-line accessories (cosmetic/vanity case, backpack,
  // wallet, card holder, clutch).
  ...(["small", "medium", "large"] as const).map((size) => ({
    brand: "Chanel",
    style: "Gabrielle",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["gabrielle", size],
    excludeTokens: ["cosmetic", "case", "backpack", "wallet", "card", "clutch", "vanity", "coin", "pouch", "belt"],
    minPrice: 1500,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),

  // Chanel Wallet on Chain (#427) — the classic CC WOC (one size). excludeTokens
  // route the line-specific WOCs (Boy / 19 / Gabrielle / Reissue 2.55) to their own
  // styles, leaving the timeless CC Turnlock WOC here.
  {
    brand: "Chanel",
    style: "Wallet on Chain",
    size_label: "WOC",
    requireTokens: ["wallet-on-chain"],
    excludeTokens: ["boy", "19", "gabrielle", "reissue", "2.55", "handle", "phone", "coco", "business"],
    minPrice: 1200,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  },

  // Gucci Dionysus (#201) — sizes Super Mini / Mini / Small / Medium. "Super Mini"
  // contains "mini", so the Mini target excludes "super"; the Super Mini target
  // anchors on the handle token "super-mini-dionysus". excludeTokens drop the chain
  // wallet / card case SLGs.
  {
    brand: "Gucci", style: "Dionysus", size_label: "Super Mini",
    requireTokens: ["super-mini-dionysus"],
    excludeTokens: ["wallet", "card", "pouch", "key"],
    minPrice: 700, maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  },
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Gucci",
    style: "Dionysus",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["dionysus", size],
    excludeTokens: size === "mini"
      ? ["super", "wallet", "card", "pouch", "belt", "key"]
      : ["wallet", "card", "pouch", "belt", "key"],
    minPrice: 700,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),

  // Gucci Horsebit 1955 (#447) — sizes Mini / Small / Shoulder (the standard unsized
  // "Horsebit 1955 Shoulder Bag"). require "horsebit-1955" (drops the Horsebit Chain
  // model + Horsebit loafers/sandals/boots); excludeTokens drop SLGs + the chain/tote/
  // bucket/top-handle sub-models. The Shoulder target is "horsebit-1955 minus a size".
  ...(["mini", "small"] as const).map((size) => ({
    brand: "Gucci",
    style: "Horsebit 1955",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["horsebit-1955", size],
    excludeTokens: ["wallet", "wristlet", "card", "pouch", "belt", "chain", "tote", "bucket", "loafer", "sandal", "boot", "pump", "mule", "slide"],
    minPrice: 900,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),
  {
    brand: "Gucci", style: "Horsebit 1955", size_label: "Shoulder",
    requireTokens: ["horsebit-1955"],
    excludeTokens: ["mini", "small", "wallet", "wristlet", "card", "pouch", "belt", "chain", "tote", "bucket", "top-handle", "loafer", "sandal", "boot", "pump", "mule", "slide"],
    minPrice: 900, maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  },

  // Celine Triomphe (#206) — sizes Nano / Mini / Small / Medium / Teen. excludeTokens
  // drop the SLGs + the distinct Triomphe-canvas sub-models (Honorine, Half Moon,
  // Bonnie, Folco, Cabas, Cylinder, Multipochette, Ava, Claude) that share branding.
  ...(["nano", "mini", "small", "medium", "teen"] as const).map((size) => ({
    brand: "Celine",
    style: "Triomphe",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["triomphe", size],
    excludeTokens: ["card", "wallet", "holder", "ava", "cabas", "claude", "clutch", "pouch", "belt", "besace", "sunglass", "honorine", "half-moon", "halfmoon", "bonnie", "folco", "cylinder", "multipochette", "messenger", "backpack", "shopper", "tote", "heart", "couer", "soft", "shopping"],
    minPrice: 900,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  })),

  // Celine Classic Box (#486) — sizes Small / Medium / Teen. require "classic-box"
  // (the bag) — drops the "box calfskin" leather belts/SLGs which contain "box".
  ...(["small", "medium", "teen"] as const).map((size) => ({
    brand: "Celine",
    style: "Classic Box",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["classic-box", size],
    excludeTokens: ["belt", "wallet", "card"],
    minPrice: 1500,
    maxPrice: 15000,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  })),

  // Saint Laurent Sac de Jour (#461) — sizes Nano / Baby / Small / Medium / Large.
  ...(["nano", "baby", "small", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Sac de Jour",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["sac-de-jour", size],
    excludeTokens: ["wallet", "card", "pouch", "belt"],
    minPrice: 800,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // Saint Laurent Kate (#462) — sizes Small / Medium / Large. excludeTokens drop the
  // Kate clutch / tassel chain wallet (WOC) + non-bags (boots/pumps that carry "kate").
  ...(["small", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Kate",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["kate", size],
    excludeTokens: ["boot", "clutch", "wallet", "card", "belt", "pump", "sandal", "mule", "sunglass", "tassel-chain"],
    minPrice: 700,
    maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),
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

  const target = TARGETS.find(
    (t) =>
      t.requireTokens.every((tok) => handle.includes(tok) || title.includes(tok)) &&
      !(t.excludeTokens ?? []).some((tok) => handle.includes(tok) || title.includes(tok))
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
