/**
 * Pure parser for Vestiaire Collective product nodes.
 *
 * Vestiaire runs on Next.js. Product and search pages embed:
 *   1. `__NEXT_DATA__` — a JSON blob containing the product object with
 *      brand, colour, material, condition, country/region, price.
 *   2. JSON-LD `Product` with overlapping fields.
 *
 * This parser accepts EITHER shape (see `VestiaireProductNode`). Callers should
 * capture the product node from whichever source is available (preference:
 * `__NEXT_DATA__` for richer region/currency; JSON-LD as fallback).
 *
 * Input discrimination — which shape you have:
 *   __NEXT_DATA__ node: price.cents | price.amount, color.name | colors[].name,
 *     material.name | materials[].name, country.name | country.code,
 *     condition (Vestiaire grade string).
 *   JSON-LD Product: offers.price + offers.priceCurrency (plain numbers/strings),
 *     color (string), material (string), country (string),
 *     itemCondition (schema.org URL, e.g. ".../NewCondition").
 *   Both may carry hardware as a free string.
 *
 * Condition mapping (Vestiaire grade strings → SaleCondition):
 *   "Never worn" / "New with tags" / "Brand new"      → "new"
 *   "Never worn, with tag"                             → "new"
 *   "Excellent condition" / "Excellent"                → "excellent"
 *   "Very good condition" / "Very good"                → "very good"
 *   "Good condition" / "Good"                          → "good"
 *   "Fair condition" / "Fair"                          → "fair"
 *   "Gently used" / "Signs of wear" / ambiguous        → null (never invented)
 *
 * schema.org itemCondition URL mapping (JSON-LD fallback):
 *   ".../NewCondition"            → "new"
 *   ".../LikeNewCondition"        → "excellent"
 *   ".../UsedCondition"           → null  (too broad)
 *   ".../RefurbishedCondition"    → null
 *
 * Pure: no network, no DB. Tested in src/lib/__tests__/vestiaire.test.ts.
 */

import type { SaleCondition } from "./types";

// --- Shared vocab (mirrors trr.ts constants — ordered most-specific-first) ---
// NOTE: trr.ts does not export MATERIALS/COLORS as of this writing (module-private).
// Replicated here; if they are exported in future, prefer importing from trr.ts.

/**
 * Material keywords, most-specific-first. The parser returns the first match
 * so compound terms ("Caviar Leather") must precede their components ("Leather").
 * Extended with Hermès leathers and LV/Gucci canvases to match the TRR vocab.
 */
const MATERIALS = [
  // Hermès leathers & skins (grounded in real TRR captures)
  "Epsom Leather", "Togo Leather", "Clemence Leather", "Swift Leather",
  "Box Leather", "Barenia Leather", "Evercolor Leather", "Fjord Leather",
  "Chevre Mysore Goatskin", "Chevre Goatskin",
  "Epsom", "Togo", "Clemence", "Swift", "Barenia", "Evercolor", "Fjord",
  "Chevre", "Goatskin", "Ostrich", "Crocodile", "Alligator",
  // Louis Vuitton / Gucci canvases
  "Monogram Canvas", "Damier Ebene", "Damier Azur", "Damier",
  "GG Supreme Canvas", "GG Canvas", "Microguccissima", "Matelassé", "Matelasse",
  // Chanel & general (compound before generic)
  "Caviar Leather", "Lambskin Leather", "Patent Leather", "Calfskin Leather",
  "Caviar", "Lambskin", "Patent", "Suede", "Tweed", "Jersey", "Calfskin",
  "Lizard", "Python", "Velvet", "Denim", "Wool", "Canvas", "Leather",
];

/**
 * Known colours. Vestiaire surfaces colour as a dedicated field (color.name or
 * color string) so we use it directly, but normalise against this list for
 * canonical casing. French/Hermès colour names included for cross-brand coverage.
 * Gold/Silver excluded — they collide with hardware tones when present in names.
 */
const COLORS = [
  "Black", "White", "Beige", "Brown", "Red", "Blue", "Navy", "Pink", "Green",
  "Grey", "Gray", "Burgundy", "Purple", "Yellow", "Orange", "Tan", "Khaki",
  "Metallic", "Neutrals", "Cream", "Ivory", "Multicolor", "Coral", "Turquoise",
  "Bordeaux", "Nude", "Taupe",
  // Hermès / French colour names
  "Noir", "Blanc", "Craie", "Etoupe", "Étoupe", "Etain", "Étain", "Gris",
  "Bleu", "Rouge", "Vert", "Rose", "Jaune", "Marron", "Fauve", "Gold",
];

/**
 * Hardware pattern. Captures the metal name (group 1) from strings like:
 *   "Gold-Tone Hardware", "Silver Tone Hardware", "Rose Gold Hardware",
 *   "Gold-Plated Hardware", "Palladium Hardware"
 * Result is lowercased and spaces→hyphens for storage consistency.
 */
const HARDWARE_RE =
  /\b(Gold|Silver|Ruthenium|Rose Gold|Gunmetal|Palladium|Brass|Bronze)(?:[- ](?:Tone|Plated))?\s+Hardware/i;

/**
 * A Vestiaire Collective product node — accepts either the __NEXT_DATA__ product
 * object or the JSON-LD Product. All fields are optional/nullable so the parser
 * degrades gracefully when a field isn't present.
 *
 * Discriminating fields by source:
 *
 * __NEXT_DATA__ product node (preferred — richer, has cents/region/country obj):
 *   price.cents | price.amount, color.name | colors[].name,
 *   material.name | materials[].name, country.name | country.code,
 *   condition (Vestiaire grade string e.g. "Very good condition")
 *
 * JSON-LD Product (fallback — less granular):
 *   offers.price + offers.priceCurrency (plain numbers/strings),
 *   color (string), material (string), country (string),
 *   itemCondition (schema.org URL e.g. "https://schema.org/NewCondition")
 */
export interface VestiaireProductNode {
  // Identifiers
  id?: string | number | null;
  uuid?: string | null;
  url?: string | null;

  // Listing metadata
  name?: string | null;
  brand?: { name?: string | null } | string | null;

  // Spec fields (__NEXT_DATA__ style — object or array of objects)
  color?: { name?: string | null } | string | null;
  colors?: Array<{ name?: string | null }> | null;
  material?: { name?: string | null } | string | null;
  materials?: Array<{ name?: string | null }> | null;
  /** Raw hardware string, e.g. "Gold-Tone Hardware" */
  hardware?: string | null;

  // Condition — Vestiaire's own grade string (e.g. "Very good condition")
  condition?: string | null;

  // Price — Vestiaire uses various shapes depending on API version
  price?: {
    cents?: number | null;
    amount?: number | string | null;
    currency?: string | null;
  } | number | string | null;

  // Region / country of seller
  country?: { name?: string | null; code?: string | null } | string | null;
  /** Explicit region string (rare — country is more common). */
  region?: string | null;

  // JSON-LD style (fallback)
  offers?: {
    price?: number | string | null;
    priceCurrency?: string | null;
  } | null;
  /** schema.org itemCondition URL, e.g. "https://schema.org/NewCondition" */
  itemCondition?: string | null;
}

export interface VestiaireSpec {
  color: string | null;
  material: string | null;
  hardwareColor: string | null;
  productionYear: number | null;
  season: string | null;
  inclusions: null; // Vestiaire doesn't surface inclusions in the product JSON
  condition: SaleCondition | null;
  price: number | null;
  currency: string;
  region: string | null;
  country: string | null;
}

// ---------------------------------------------------------------------------
// Condition mapping
// ---------------------------------------------------------------------------

/**
 * Maps Vestiaire grade strings and schema.org itemCondition URLs to SaleCondition.
 * Returns null for anything ambiguous or unrecognised — never invents a condition.
 *
 * Handles both Vestiaire's own grade strings and JSON-LD schema.org URLs:
 *   "https://schema.org/NewCondition"      → "new"
 *   "https://schema.org/LikeNewCondition"  → "excellent"
 *   "https://schema.org/UsedCondition"     → null (too broad)
 */
export function mapVestiaireCondition(raw: string | null | undefined): SaleCondition | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();

  // schema.org itemCondition URL fallback (JSON-LD)
  if (s.includes("schema.org")) {
    if (/newcondition/.test(s) && !/likenew/.test(s)) return "new";
    if (/likenewcondition/.test(s)) return "excellent";
    return null; // UsedCondition / RefurbishedCondition → too broad
  }

  // Vestiaire grade strings
  if (/never\s+worn/.test(s)) return "new";
  if (/new\s+with\s+tags?/.test(s)) return "new";
  if (/brand\s+new/.test(s)) return "new";

  if (/excellent\s+condition/.test(s)) return "excellent";
  if (/^excellent$/.test(s)) return "excellent";

  if (/very\s+good\s+condition/.test(s)) return "very good";
  if (/^very\s+good$/.test(s)) return "very good";

  if (/^good\s+condition$/.test(s)) return "good";
  if (/^good$/.test(s)) return "good";

  if (/^fair\s+condition$/.test(s)) return "fair";
  if (/^fair$/.test(s)) return "fair";

  // "Gently used", "Signs of wear", "Satisfactory condition", etc. → null
  return null;
}

// ---------------------------------------------------------------------------
// Field accessors (handle both __NEXT_DATA__ and JSON-LD shapes)
// ---------------------------------------------------------------------------

function extractString(v: { name?: string | null } | string | null | undefined): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.trim() || null;
  return v.name?.trim() || null;
}

function extractPrice(p: VestiaireProductNode["price"]): { amount: number | null; currency: string } {
  if (p == null) return { amount: null, currency: "EUR" };
  if (typeof p === "number") return { amount: p > 0 ? p : null, currency: "EUR" };
  if (typeof p === "string") {
    const n = Number(String(p).replace(/[^0-9.]/g, ""));
    return { amount: Number.isFinite(n) && n > 0 ? n : null, currency: "EUR" };
  }
  // Object shape
  let amount: number | null = null;
  if (typeof p.cents === "number" && Number.isFinite(p.cents) && p.cents > 0) {
    amount = p.cents / 100;
  } else if (p.amount != null) {
    const n = Number(String(p.amount).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n) && n > 0) amount = n;
  }
  return { amount, currency: (p.currency ?? "EUR").trim() || "EUR" };
}

function extractRegion(node: VestiaireProductNode): { region: string | null; country: string | null } {
  // Explicit region string (rare)
  if (node.region) return { region: node.region.trim() || null, country: null };
  // Country object or string
  const c = node.country;
  if (!c) return { region: null, country: null };
  if (typeof c === "string") {
    const name = c.trim() || null;
    return { region: name, country: name };
  }
  const name = c.name?.trim() || null;
  const code = c.code?.trim() || null;
  return {
    region: name ?? code,
    country: name,
  };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a Vestiaire Collective product node into a structured spec.
 * All fields are best-effort; null when absent or unrecognised.
 * Condition is mapped to SaleCondition ONLY when unambiguously matchable.
 *
 * Accepts __NEXT_DATA__ product nodes (price.cents/amount, color.name, country.name)
 * OR JSON-LD Product nodes (offers.price, string color, itemCondition URL).
 */
export function parseVestiaireProduct(node: VestiaireProductNode): VestiaireSpec {
  // --- Price (prefer __NEXT_DATA__ price obj; fall back to offers for JSON-LD) ---
  const rawPrice = node.price != null
    ? node.price
    : node.offers
      ? { amount: node.offers.price, currency: node.offers.priceCurrency }
      : null;
  const { amount: price, currency } = extractPrice(rawPrice as VestiaireProductNode["price"]);

  // --- Region ---
  const { region, country } = extractRegion(node);

  // --- Colour ---
  // Prefer color.name / color string; fall back to colors[0]
  let color: string | null = null;
  const rawColor =
    extractString(node.color) ??
    (Array.isArray(node.colors) && node.colors.length > 0 ? extractString(node.colors[0]) : null);
  if (rawColor) {
    const matched = COLORS.find((c) => c.toLowerCase() === rawColor.toLowerCase());
    color = matched ?? rawColor; // use canonical casing if known, else raw value
  }

  // --- Material ---
  // Prefer material.name / material string; fall back to materials[0]
  let material: string | null = null;
  const rawMaterial =
    extractString(node.material) ??
    (Array.isArray(node.materials) && node.materials.length > 0 ? extractString(node.materials[0]) : null);
  if (rawMaterial) {
    // First match wins (list is most-specific-first — compound before generic)
    const matched = MATERIALS.find((m) =>
      new RegExp(`\\b${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(rawMaterial)
    );
    material = matched ?? rawMaterial;
  }

  // --- Hardware ---
  let hardwareColor: string | null = null;
  if (node.hardware) {
    const hw = HARDWARE_RE.exec(node.hardware);
    if (hw) {
      // "Gold" → "gold", "Rose Gold" → "rose-gold"
      hardwareColor = hw[1].toLowerCase().replace(/\s+/g, "-");
    } else {
      hardwareColor = node.hardware.trim() || null;
    }
  }

  // --- Condition ---
  // Prefer Vestiaire grade string; fall back to schema.org itemCondition
  const rawCondition = node.condition ?? node.itemCondition ?? null;
  const condition = mapVestiaireCondition(rawCondition);

  return {
    color,
    material,
    hardwareColor,
    productionYear: null, // Vestiaire doesn't expose collection year in product JSON
    season: null,
    inclusions: null,
    condition,
    price,
    currency,
    region,
    country,
  };
}

// ---------------------------------------------------------------------------
// __NEXT_DATA__ path helper
// ---------------------------------------------------------------------------

/**
 * Searches a parsed __NEXT_DATA__ object for the Vestiaire product node.
 * Tries the known candidate paths first, then falls back to a recursive
 * depth-first scan for any object that looks like a product node (has
 * brand + price keys, or similar).
 *
 * UNVERIFIED: the exact path changes with Vestiaire deploys. Confirm live.
 *
 * Usage — paste into the browser console on a logged-in Vestiaire product page:
 *   const data = JSON.parse(document.getElementById('__NEXT_DATA__').textContent);
 *   const node = findVestiaireProductNode(data);
 *   console.log(JSON.stringify(node, null, 2));
 *
 * Current candidates (in priority order):
 *   1. data.props.pageProps.product
 *   2. data.props.pageProps.initialReduxState.product
 *   3. data.props.pageProps.initialState.product
 *   4. data.props.pageProps.data.product
 *   5. data.props.pageProps.productDetails
 *   6. data.props.pageProps.item
 */
export function findVestiaireProductNode(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  // Candidate paths — most common Vestiaire Next.js shapes
  type Getter = (o: Record<string, unknown>) => unknown;
  const candidates: Getter[] = [
    (o) => (
      (o["props"] as Record<string, unknown>)?.["pageProps"] as Record<string, unknown>
    )?.["product"],
    (o) => (
      ((o["props"] as Record<string, unknown>)?.["pageProps"] as Record<string, unknown>)
        ?.["initialReduxState"] as Record<string, unknown>
    )?.["product"],
    (o) => (
      ((o["props"] as Record<string, unknown>)?.["pageProps"] as Record<string, unknown>)
        ?.["initialState"] as Record<string, unknown>
    )?.["product"],
    (o) => (
      ((o["props"] as Record<string, unknown>)?.["pageProps"] as Record<string, unknown>)
        ?.["data"] as Record<string, unknown>
    )?.["product"],
    (o) => (
      (o["props"] as Record<string, unknown>)?.["pageProps"] as Record<string, unknown>
    )?.["productDetails"],
    (o) => (
      (o["props"] as Record<string, unknown>)?.["pageProps"] as Record<string, unknown>
    )?.["item"],
  ];

  for (const fn of candidates) {
    try {
      const node = fn(d);
      if (node && typeof node === "object" && isLikelyProductNode(node)) {
        return node as Record<string, unknown>;
      }
    } catch {
      // path didn't exist — continue
    }
  }

  // Recursive fallback: depth-first search for first object with product-like keys
  return deepFindProductNode(d, 0);
}

function isLikelyProductNode(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  // A Vestiaire product node will have at least two of these keys
  const hits = ["brand", "price", "condition", "id", "color", "material"].filter((k) => k in o);
  return hits.length >= 2;
}

function deepFindProductNode(obj: unknown, depth: number): Record<string, unknown> | null {
  if (depth > 6 || !obj || typeof obj !== "object") return null;
  if (isLikelyProductNode(obj)) return obj as Record<string, unknown>;
  for (const v of Object.values(obj as Record<string, unknown>)) {
    const found = deepFindProductNode(v, depth + 1);
    if (found) return found;
  }
  return null;
}
