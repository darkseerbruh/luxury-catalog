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
 * Condition mapping:
 *   "Never worn" / "New with tags" / "Brand new"      → "new"
 *   "Never worn, with tag"                             → "new"
 *   "Excellent condition"                              → "excellent"
 *   "Very good condition"                              → "very good"
 *   "Good condition"                                   → "good"
 *   "Fair condition"                                   → "fair"
 *   anything else / missing                            → null (never invented)
 *
 * Pure: no network, no DB. Tested in src/lib/__tests__/vestiaire.test.ts.
 */

import type { SaleCondition } from "./types";

// --- Shared vocab (mirrors trr.ts constants) ---
// NOTE: trr.ts does not export MATERIALS/COLORS as of this writing (module-private).
// Replicated here; if they are exported in future, prefer importing from trr.ts.

const MATERIALS = [
  "Caviar Leather", "Lambskin Leather", "Patent Leather", "Calfskin Leather",
  "Caviar", "Lambskin", "Patent", "Suede", "Tweed", "Jersey", "Calfskin",
  "Lizard", "Python", "Velvet", "Denim", "Wool", "Canvas", "Leather",
];

const COLORS = [
  "Black", "White", "Beige", "Brown", "Red", "Blue", "Navy", "Pink", "Green",
  "Grey", "Gray", "Burgundy", "Purple", "Yellow", "Orange", "Tan", "Khaki",
  "Metallic", "Neutrals", "Cream", "Ivory", "Multicolor", "Coral", "Turquoise",
  "Bordeaux", "Nude", "Taupe",
];

const HARDWARE_RE = /\b(Gold|Silver|Ruthenium|Rose Gold|Gunmetal|Palladium|Brass|Bronze)(?:\s*[-]?\s*Tone)?\s+Hardware/i;

/**
 * A Vestiaire Collective product node — accepts either the __NEXT_DATA__ product
 * object or the JSON-LD Product. All fields are optional/nullable so the parser
 * degrades gracefully when a field isn't present.
 *
 * Key __NEXT_DATA__ fields (from Vestiaire's Next.js pages):
 *   - brand.name, category.name, name (title)
 *   - color.name (or colors[].name)
 *   - material.name (or materials[].name)
 *   - condition (string grade from Vestiaire's grading system)
 *   - price.cents + price.currency (or price.amount + price.currency)
 *   - country.name / country.code (seller's location)
 *   - id / uuid (stable listing id)
 *   - url (canonical product URL)
 *
 * JSON-LD Product overlapping fields:
 *   - offers.price, offers.priceCurrency
 *   - brand.name
 *   - color, material
 *   - itemCondition (schema.org URL — less granular)
 *   - name
 */
export interface VestiaireProductNode {
  // Identifiers
  id?: string | number | null;
  uuid?: string | null;
  url?: string | null;

  // Listing metadata
  name?: string | null;
  brand?: { name?: string | null } | string | null;

  // Spec fields (__NEXT_DATA__ style)
  color?: { name?: string | null } | string | null;
  colors?: Array<{ name?: string | null }> | null;
  material?: { name?: string | null } | string | null;
  materials?: Array<{ name?: string | null }> | null;
  hardware?: string | null;

  // Condition — Vestiaire's own grade string
  condition?: string | null;

  // Price — Vestiaire uses various shapes
  price?: {
    cents?: number | null;
    amount?: number | string | null;
    currency?: string | null;
  } | number | string | null;

  // Region / country of seller
  country?: { name?: string | null; code?: string | null } | string | null;
  region?: string | null;

  // JSON-LD style (fallback)
  offers?: {
    price?: number | string | null;
    priceCurrency?: string | null;
  } | null;
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
 * Condition strings from Vestiaire's grading system → SaleCondition enum.
 * ONLY maps strings that unambiguously match a real grade. Everything else → null.
 * Never invents a condition.
 */
export function mapVestiaireCondition(raw: string | null | undefined): SaleCondition | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();

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
  // Explicit region string
  if (node.region) return { region: node.region.trim() || null, country: null };
  // Country object or string
  const c = node.country;
  if (!c) return { region: null, country: null };
  if (typeof c === "string") return { region: c.trim() || null, country: c.trim() || null };
  return {
    region: c.name?.trim() || c.code?.trim() || null,
    country: c.name?.trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a Vestiaire Collective product node into a structured spec.
 * All fields are best-effort; null when absent or unrecognised.
 * Condition is mapped to SaleCondition ONLY when unambiguously matchable.
 */
export function parseVestiaireProduct(node: VestiaireProductNode): VestiaireSpec {
  // --- Price ---
  const rawPrice = node.price ?? (node.offers ? { amount: node.offers.price, currency: node.offers.priceCurrency } : null);
  const { amount: price, currency } = extractPrice(rawPrice as VestiaireProductNode["price"]);

  // --- Region ---
  const { region, country } = extractRegion(node);

  // --- Colour ---
  let color: string | null = null;
  const rawColor =
    extractString(node.color) ??
    (Array.isArray(node.colors) ? extractString(node.colors[0]) : null);
  if (rawColor) {
    const matched = COLORS.find((c) => c.toLowerCase() === rawColor.toLowerCase());
    color = matched ?? rawColor; // use canonical form if known, else raw value
  }

  // --- Material ---
  let material: string | null = null;
  const rawMaterial =
    extractString(node.material) ??
    (Array.isArray(node.materials) ? extractString(node.materials[0]) : null);
  if (rawMaterial) {
    const matched = MATERIALS.find((m) => new RegExp(`\\b${m}\\b`, "i").test(rawMaterial));
    material = matched ?? rawMaterial;
  }

  // --- Hardware ---
  let hardwareColor: string | null = null;
  if (node.hardware) {
    const hw = HARDWARE_RE.exec(node.hardware);
    if (hw) hardwareColor = hw[1].toLowerCase().replace(/\s+/g, "-");
    else hardwareColor = node.hardware.trim() || null; // keep raw if no pattern match
  }

  // --- Condition ---
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
