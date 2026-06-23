/**
 * Pure parser for Fashionphile product JSON (Shopify product API).
 *
 * Fashionphile runs on Shopify. Same-origin fetch of
 *   /products/<handle>.json
 * returns a `{product:{title, handle, body_html, tags, variants:[{price,sku}],...}}`
 * shape. Colour and hardware appear in `tags` AND in `body_html`; condition is
 * on-page (separate section, not in this JSON). Price is in `variants[].price`.
 *
 * Usage:
 *   const spec = parseFashionphileProduct(product);
 *
 * Pure: no network, no DB. Tested in src/lib/__tests__/fashionphile.test.ts.
 */

// --- Shared vocab (mirrors trr.ts constants) ---
// NOTE: trr.ts does not export MATERIALS/COLORS/HARDWARE as of this writing —
// they are module-private. Replicated here with a comment; if they are exported
// in future, prefer importing from '../ingest/trr' to keep vocab in sync.

const MATERIALS = [
  "Caviar Leather", "Lambskin Leather", "Patent Leather", "Calfskin Leather",
  "Caviar", "Lambskin", "Patent", "Suede", "Tweed", "Jersey", "Calfskin",
  "Lizard", "Python", "Velvet", "Denim", "Wool", "Canvas", "Leather",
];

// Gold/Silver excluded intentionally — they collide with hardware tone.
const COLORS = [
  "Black", "White", "Beige", "Brown", "Red", "Blue", "Navy", "Pink", "Green",
  "Grey", "Gray", "Burgundy", "Purple", "Yellow", "Orange", "Tan", "Khaki",
  "Metallic", "Neutrals", "Cream", "Ivory", "Multicolor", "Coral", "Turquoise",
  "Bordeaux", "Nude", "Taupe",
];

const HARDWARE_RE = /\b(Gold|Silver|Ruthenium|Rose Gold|Gunmetal|Palladium|Brass|Bronze)(?:\s*[-]?\s*Tone)?\s+(?:Hardware|Tone(?:\s+Hardware)?)/i;
const HARDWARE_TAG_RE = /^(gold|silver|ruthenium|rose[-\s]?gold|gunmetal|palladium|brass|bronze)(?:\s*[-]?\s*tone)?\s*(?:hardware)?$/i;

/** Shape of a Shopify product-JSON `product` object (relevant fields only). */
export interface ShopifyProduct {
  title?: string | null;
  handle?: string | null;
  body_html?: string | null;
  tags?: string[];
  variants?: Array<{
    price?: string | number | null;
    sku?: string | null;
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
  /** Condition is not present in the Shopify JSON; always null from this parser. */
  condition: null;
}

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
 * Parse a Fashionphile Shopify product JSON object into a structured spec.
 * All fields are best-effort; null when absent or unrecognised.
 * Condition is always null — it is only on the product page, not in the API response.
 */
export function parseFashionphileProduct(product: ShopifyProduct): FashionphileSpec {
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
  };

  // --- SKU + price from first variant ---
  const variant = product.variants?.[0];
  if (variant) {
    if (variant.sku) spec.sku = String(variant.sku).trim() || null;
    if (variant.price != null) {
      const p = Number(String(variant.price).replace(/[^0-9.]/g, ""));
      if (Number.isFinite(p) && p > 0) spec.price = p;
    }
  }

  const tags: string[] = Array.isArray(product.tags) ? product.tags : [];
  const bodyText = product.body_html ? stripHtml(product.body_html) : "";
  const titleText = product.title ?? "";

  // Combine title + body for scanning — body_html is the primary spec source
  const combined = `${titleText} ${bodyText}`;

  // --- Colour: check tags first (Fashionphile uses colour-tag convention), then
  //     fall through to scanning combined text for known colours. ---
  for (const tag of tags) {
    const t = tag.trim().toLowerCase();
    const matched = COLORS.find((c) => c.toLowerCase() === t);
    if (matched) { spec.color = matched; break; }
  }
  if (!spec.color) {
    for (const color of COLORS) {
      if (new RegExp(`\\b${color}\\b`, "i").test(combined)) {
        spec.color = color;
        break;
      }
    }
  }

  // --- Material: scan tags, then body text ---
  for (const tag of tags) {
    const mat = MATERIALS.find((m) => new RegExp(`\\b${m}\\b`, "i").test(tag));
    if (mat) { spec.material = mat; break; }
  }
  if (!spec.material) {
    for (const mat of MATERIALS) {
      if (new RegExp(`\\b${mat}\\b`, "i").test(combined)) {
        spec.material = mat;
        break;
      }
    }
  }

  // --- Hardware colour: check tags for "Gold Hardware", "Silver-Tone", etc. ---
  for (const tag of tags) {
    const hw = HARDWARE_TAG_RE.exec(tag.trim());
    if (hw) {
      spec.hardwareColor = hw[1].toLowerCase().replace(/\s+/g, "-").replace("-tone", "");
      break;
    }
  }
  if (!spec.hardwareColor) {
    const hw = HARDWARE_RE.exec(combined);
    if (hw) spec.hardwareColor = hw[1].toLowerCase().replace(/\s+/g, "-");
  }

  // --- Production year / season: "YYYY" or "YYYY-YYYY" in body ---
  const seasonMatch = bodyText.match(/(?:from\s+the\s+)?(\d{4}(?:-\d{4})?)\s+collection/i);
  if (seasonMatch) {
    spec.season = seasonMatch[1];
    spec.productionYear = Number(seasonMatch[1].slice(0, 4));
  } else {
    // Fallback: a standalone 4-digit year in a reasonable range
    const yearMatch = bodyText.match(/\b(19[6-9]\d|20[0-2]\d)\b/);
    if (yearMatch) spec.productionYear = Number(yearMatch[1]);
  }

  // --- Inclusions ---
  const inclMatch = bodyText.match(/includes?\s+([^.]+)\./i);
  if (inclMatch) spec.inclusions = inclMatch[1].trim();

  return spec;
}
