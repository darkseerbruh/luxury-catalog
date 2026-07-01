/**
 * Pure parser for Fashionphile product JSON (Shopify product API).
 *
 * Fashionphile runs on Shopify. Same-origin fetch of
 *   /products/<handle>.json
 * returns a `{product:{title, handle, body_html, tags, variants:[{price,sku}],...}}`
 * shape.
 *
 * IMPORTANT CORRECTION (grounded in live inspection, 2026-06-22):
 * The `tags` array does NOT reliably contain colour/hardware — real-world tags
 * can be completely unrelated (e.g. "Cardi B"). The actual spec lives in the
 * `title` (e.g. "Calfskin Archetype Small Shopping Tote Dark Burgundy") and in
 * `body_html` (e.g. "crafted with burgundy calfskin leather…gold-tone hardware").
 *
 * Extraction order: title first, then body_html for each field.
 *
 * Condition is NOT in the Shopify product JSON. It appears on search/listing
 * cards as "Condition: <grade>". If the caller captured a grade from the card,
 * pass it as `conditionGrade`; this module maps it to the SaleCondition enum.
 * Fashionphile grade ladder:
 *   New | Giftable  → "new"    (Giftable = like-new/store quality)
 *   Excellent       → "excellent"
 *   Very Good       → "very good"
 *   Good            → "good"
 *   Fair            → "fair"   (sometimes "Pre-Owned Fair")
 *
 * Usage:
 *   const spec = parseFashionphileProduct(product);
 *   // with captured condition grade from the listing card:
 *   const spec = parseFashionphileProduct(product, "Excellent");
 *   const cond = mapFashionphileCondition("Giftable"); // → "new"
 *
 * Pure: no network, no DB. Tested in src/lib/__tests__/fashionphile.test.ts.
 */

import type { SaleCondition } from "./types";
import { extractDescriptionFacts, scrubPii, type DescriptionFacts } from "./description-facts";

// ---------------------------------------------------------------------------
// Shared vocab — mirrors trr.ts constants (expanded for multi-brand coverage)
// ---------------------------------------------------------------------------
// Ordered MOST-SPECIFIC-FIRST: first match wins.

const MATERIALS = [
  // Hermès leathers & skins
  "Epsom Leather", "Togo Leather", "Clemence Leather", "Swift Leather",
  "Box Leather", "Barenia Leather", "Evercolor Leather", "Fjord Leather",
  "Chevre Mysore Goatskin", "Chevre Goatskin",
  "Epsom", "Togo", "Clemence", "Swift", "Barenia", "Evercolor", "Fjord",
  "Chevre", "Goatskin", "Ostrich", "Crocodile", "Alligator",
  // Louis Vuitton / Gucci canvases
  "Monogram Canvas", "Damier Ebene", "Damier Azur", "Damier",
  "GG Supreme Canvas", "GG Canvas", "Microguccissima", "Matelassé", "Matelasse",
  // Chanel & general
  "Caviar Leather", "Lambskin Leather", "Patent Leather", "Calfskin Leather",
  "Caviar", "Lambskin", "Patent", "Suede", "Tweed", "Jersey", "Calfskin",
  "Lizard", "Python", "Velvet", "Denim", "Wool", "Canvas", "Leather",
];

// Multi-word colours listed before single-word variants so the longest match wins.
// Gold/Silver are intentionally kept — they are in the list but we skip them when
// scanning inside a confirmed hardware phrase.
const COLORS = [
  // Multi-word first
  "Dark Burgundy", "Dark Brown", "Dark Green", "Dark Navy", "Light Pink",
  "Light Blue", "Light Beige", "Rose Gold",
  // Standard colours
  "Black", "White", "Beige", "Brown", "Red", "Blue", "Navy", "Pink", "Green",
  "Grey", "Gray", "Burgundy", "Purple", "Yellow", "Orange", "Tan", "Khaki",
  "Metallic", "Neutrals", "Cream", "Ivory", "Multicolor", "Coral", "Turquoise",
  "Bordeaux", "Nude", "Taupe",
  // Hermès / French colour names
  "Noir", "Blanc", "Craie", "Etoupe", "Étoupe", "Etain", "Étain", "Gris",
  "Bleu", "Rouge", "Vert", "Rose", "Jaune", "Marron", "Fauve", "Gold",
];

// Hardware regex: matches "Gold-Tone Hardware", "Silver Tone Hardware",
// "Gold-Plated Hardware", "Ruthenium Hardware", etc.
const HARDWARE_RE = /\b(Gold|Silver|Ruthenium|Rose Gold|Gunmetal|Palladium|Brass|Bronze)(?:[- ](?:Tone|Plated))?\s+Hardware/i;

// Lighter form — catches "gold-tone" / "gold tone" without trailing "Hardware"
const HARDWARE_TONE_RE = /\b(Gold|Silver|Ruthenium|Rose Gold|Gunmetal|Palladium|Brass|Bronze)[- ](?:Tone|Plated)\b/i;

// Metal in a HARDWARE context (chain/lock/clasp/zipper/stud…) — catches "gold chain",
// "silver lock", "palladium hardware" where the metal describes hardware, not a colourway.
// "rose gold" precedes "gold" so the longer match wins. The trailing hardware noun is what
// keeps a gold/silver *colourway* ("gold caviar leather") from matching.
const HARDWARE_CONTEXT_RE = /\b(Rose Gold|Gold|Silver|Ruthenium|Palladium|Gunmetal|Brass|Bronze)[- ](?:tone|plated|chain(?:[- ]link)?|lock|clasp|zipper|zip|hardware|stud|studs|buckle|metal|finish|accents?|detailing|chain strap)\b/i;

// Finish-qualified metal — "aged gold", "polished palladium", "brushed silver".
const HARDWARE_FINISH_RE = /\b(?:aged|polished|brushed|shiny|matte|antique|light)\s+(Rose Gold|Gold|Silver|Ruthenium|Palladium|Gunmetal|Brass|Bronze)\b/i;

// ---------------------------------------------------------------------------
// Condition mapping
// ---------------------------------------------------------------------------

/**
 * Fashionphile's display grades (case-insensitive match). Fashionphile renamed its
 * middle tiers; the current public ladder (verified live 2026-06-29, best→worst) is:
 *   New | Excellent | Shows Wear | Worn | Fair
 * We map it position-for-position onto our 5-tier SaleCondition enum, and keep the
 * legacy labels (Giftable / Very Good / Good) so older captures still resolve.
 */
const CONDITION_MAP: Array<[RegExp, SaleCondition]> = [
  [/^brand\s*new/i,      "new"],
  [/^new(\s*(without\s*tags|unworn))?$/i, "new"],
  [/^giftable$/i,        "new"],       // legacy "Giftable" = like-new / store quality
  [/^excellent$/i,       "excellent"],
  [/^very\s+good$/i,     "very good"], // legacy tier
  [/^shows?\s+wear$/i,   "very good"], // current tier directly below Excellent
  [/^worn$/i,            "good"],      // current tier directly below Shows Wear
  [/^good$/i,            "good"],      // legacy tier
  [/^fair$/i,            "fair"],
  [/pre.?owned\s+fair/i, "fair"],
];

/**
 * Map a Fashionphile condition grade string to the SaleCondition enum.
 * Returns null for unrecognised grades.
 */
export function mapFashionphileCondition(grade: string | null | undefined): SaleCondition | null {
  if (!grade) return null;
  const g = grade.trim();
  for (const [re, val] of CONDITION_MAP) {
    if (re.test(g)) return val;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Shopify product shape
// ---------------------------------------------------------------------------

/** Shape of a Shopify product-JSON `product` object (relevant fields only). */
export interface ShopifyProduct {
  title?: string | null;
  handle?: string | null;
  body_html?: string | null;
  tags?: string[];
  /** Clean brand string from Shopify (e.g. "Chanel"); more reliable than slug parsing. */
  vendor?: string | null;
  /** ISO timestamps from the feed — first-listed / publish / last-change signals. */
  created_at?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  variants?: Array<{
    price?: string | number | null;
    sku?: string | null;
    /** Pre-sale / original asking price — discount-depth signal when > price. */
    compare_at_price?: string | number | null;
  }>;
}

export interface FashionphileSpec {
  color: string | null;
  material: string | null;
  hardwareColor: string | null;
  productionYear: number | null;
  season: string | null;
  inclusions: string | null;
  sku: string | null;
  price: number | null;
  currency: string;
  /**
   * Condition mapped from the grade captured off the listing/product page.
   * Always null if no grade was passed; never inferred from the product JSON alone.
   */
  condition: SaleCondition | null;
  /** Marketplace region (cross-currency fairness), from the feed's country tag. */
  region: string | null;
  /** Date the listing was first published on the site (YYYY-MM-DD), from the feed. */
  listedAt: string | null;
  /** Original/pre-sale asking price, when the feed advertises a markdown. */
  compareAtPrice: number | null;
  /** Raw per-listing condition write-up (free-text), when captured from the page. */
  conditionDetail: string | null;
  /** Structured facts mined from the description (strap/closure/interior/measurements…). */
  descFacts: DescriptionFacts | null;
  /** Scrubbed (PII-removed) description text, kept as a private reference only. */
  sourceDescription: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip HTML tags from a body_html string (simple, for spec extraction). */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Scan `text` for a known colour. Multi-word colours are tried before single-word
 * variants (COLORS is ordered longest-first for multi-word entries).
 * If `hwPhrase` is provided, skip any match whose token appears in that phrase
 * to avoid "gold-tone hardware" being counted as a gold colour.
 */
function extractColor(text: string, hwPhrase?: string): string | null {
  for (const color of COLORS) {
    const re = new RegExp(`\\b${color}\\b`, "i");
    const m = re.exec(text);
    if (!m) continue;
    // Skip if this exact token is part of the hardware phrase.
    if (hwPhrase && new RegExp(`\\b${color}\\b`, "i").test(hwPhrase)) continue;
    return color;
  }
  return null;
}

/**
 * Scan `text` for a known material (MATERIALS is already ordered most-specific-first).
 */
function extractMaterial(text: string): string | null {
  for (const mat of MATERIALS) {
    if (new RegExp(`\\b${mat}\\b`, "i").test(text)) return mat;
  }
  return null;
}

/**
 * Extract hardware colour from `text`. Returns lower-cased metal name
 * (e.g. "gold", "silver", "rose-gold") or null.
 */
function extractHardware(text: string): string | null {
  // Most-specific-first: explicit "Hardware" > tone/plated > metal-in-context > finish.
  const m =
    HARDWARE_RE.exec(text) ??
    HARDWARE_TONE_RE.exec(text) ??
    HARDWARE_CONTEXT_RE.exec(text) ??
    HARDWARE_FINISH_RE.exec(text);
  if (!m) return null;
  return m[1].toLowerCase().replace(/\s+/g, "-");
}

// Fashionphile tags include a marketplace/country code among unrelated promo tags
// (verified live 2026-06-29: "US" sits alongside "Year-End Sale" etc.). Match only
// the known region codes so a promo tag is never mistaken for a region.
const REGION_TAGS = new Set(["US", "UK", "EU", "CA", "AU", "JP", "HK", "AE"]);

/** Pull a region/country code out of the feed's tags, or null if none present. */
function extractRegionFromTags(tags?: string[]): string | null {
  if (!tags) return null;
  for (const t of tags) {
    const code = t.trim().toUpperCase();
    if (REGION_TAGS.has(code)) return code;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a Fashionphile Shopify product JSON object into a structured spec.
 *
 * Extraction strategy (grounded in real data, 2026-06-22):
 *   1. SKU + price from first variant.
 *   2. Hardware: scan title, then body_html (extracted first so colour scan can
 *      skip hardware mentions like "gold-tone hardware").
 *   3. Colour: scan title, then body_html (skip hardware phrase to avoid "Gold"
 *      hardware being read as a gold colourway).
 *   4. Material: scan title, then body_html.
 *   5. Year/season: "YYYY Collection" or "YYYY-YYYY Collection" in combined text.
 *   6. Inclusions: "includes …" in combined text.
 *   7. Condition: mapped from optional `conditionGrade` arg (not in product JSON).
 *
 * Tags are NOT used for spec extraction — real-world Fashionphile tags are
 * unreliable (e.g. celebrity names, promo tags).
 *
 * @param product        Shopify product object from `/products/<handle>.json`
 * @param conditionGrade Optional grade string captured from the listing card
 *                       (e.g. "Excellent", "Giftable", "Very Good")
 */
export function parseFashionphileProduct(
  product: ShopifyProduct,
  conditionGrade?: string | null,
  conditionDetail?: string | null,
): FashionphileSpec {
  const spec: FashionphileSpec = {
    color: null,
    material: null,
    hardwareColor: null,
    productionYear: null,
    season: null,
    inclusions: null,
    sku: null,
    price: null,
    currency: "USD",
    condition: null,
    region: null,
    listedAt: null,
    compareAtPrice: null,
    conditionDetail: null,
    descFacts: null,
    sourceDescription: null,
  };

  // --- SKU + price + compare-at (was-price) from first variant ---
  const variant = product.variants?.[0];
  if (variant) {
    if (variant.sku) spec.sku = String(variant.sku).trim() || null;
    if (variant.price != null) {
      const p = Number(String(variant.price).replace(/[^0-9.]/g, ""));
      if (Number.isFinite(p) && p > 0) spec.price = p;
    }
    if (variant.compare_at_price != null) {
      const c = Number(String(variant.compare_at_price).replace(/[^0-9.]/g, ""));
      // Only a meaningful markdown counts (Shopify mirrors price into compare_at when none).
      if (Number.isFinite(c) && c > 0 && spec.price != null && c > spec.price) spec.compareAtPrice = c;
    }
  }

  // --- Region: the feed tags carry a country code (e.g. "US"). ---
  spec.region = extractRegionFromTags(product.tags);

  // --- Listed date: first-published / created timestamp from the feed. ---
  const listedIso = product.published_at ?? product.created_at;
  if (listedIso && /^\d{4}-\d{2}-\d{2}/.test(listedIso)) spec.listedAt = listedIso.slice(0, 10);

  // --- Condition write-up (free-text), when the caller captured it from the page. ---
  if (conditionDetail?.trim()) spec.conditionDetail = conditionDetail.trim().slice(0, 1000);

  const bodyText = product.body_html ? stripHtml(product.body_html) : "";
  const titleText = product.title ?? "";
  const combined = `${titleText} ${bodyText}`;

  // --- Hardware: title first, then body ---
  spec.hardwareColor =
    extractHardware(titleText) ??
    extractHardware(bodyText);

  // Build hardware phrase for colour-scan exclusion.
  const hwPhrase = spec.hardwareColor
    ? `${spec.hardwareColor} tone hardware`
    : undefined;

  // --- Colour: title first, then body ---
  spec.color =
    extractColor(titleText, hwPhrase) ??
    extractColor(bodyText, hwPhrase);

  // --- Material: scan combined text, prefer the most-specific match ---
  // We scan the combined string once; MATERIALS is ordered most-specific-first,
  // so the first hit in the array wins regardless of which field it came from.
  spec.material = extractMaterial(combined);

  // --- Production year / season: "YYYY Collection" or "YYYY-YYYY Collection" ---
  const seasonMatch = combined.match(/(?:from\s+the\s+)?(\d{4}(?:-\d{4})?)\s+collection/i);
  if (seasonMatch) {
    spec.season = seasonMatch[1];
    spec.productionYear = Number(seasonMatch[1].slice(0, 4));
  } else {
    // Fallback: a standalone 4-digit year in a plausible production range
    const yearMatch = bodyText.match(/\b(19[6-9]\d|20[0-2]\d)\b/);
    if (yearMatch) spec.productionYear = Number(yearMatch[1]);
  }

  // --- Inclusions ---
  const inclMatch = combined.match(/includes?\s+([^.]+)\./i);
  if (inclMatch) spec.inclusions = inclMatch[1].trim();

  // --- Condition from optional captured grade ---
  spec.condition = mapFashionphileCondition(conditionGrade);

  // --- Description facts + private reference text ---
  // Mine the description for facts the feed fields miss (strap/closure/interior/
  // measurements…) and keep a PII-scrubbed copy as a private reference, so a colour
  // or detail the structured fields left null can still be recovered later.
  const facts = extractDescriptionFacts(bodyText);
  spec.descFacts = facts;
  spec.sourceDescription = scrubPii(bodyText);
  // Backfill colour from the description when the structured scan came back null.
  if (!spec.color && facts.color) spec.color = facts.color;

  return spec;
}
