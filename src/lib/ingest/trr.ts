/**
 * Pure parser for TheRealReal product JSON-LD descriptions, which list a bag's
 * spec as period-separated facts, e.g.:
 *   "Chanel Shoulder Bag. | From the 2011-2012 Collection by Karl Lagerfeld. |
 *    Brown Leather. | Gold-Tone Hardware. | Leather Lining & Dual Interior
 *    Pockets. | Turn-Lock Closure at Front. | Includes Dust Bag."
 *
 * Resale value is highly spec-specific (one colour can fetch 2x another in the
 * same leather/season), so we capture colour / leather / hardware / year per
 * listing rather than blending. Pure + unit-tested; the fetch happens in the
 * browser (Claude-in-Chrome, same-origin) since TRR is bot-blocked to plain fetch.
 */
import { titleHasBagOverride } from "./model-normalize";

// Ordered MOST-SPECIFIC-FIRST: the parser returns the first entry that matches a
// segment, so multi-word leathers must precede the generic "Leather"/"Canvas".
const MATERIALS = [
  // Hermès leathers & skins (grounded in real TRR captures: "Noir Togo Leather",
  // "Rose Tyrien Epsom Leather", "Chevre Mysore Goatskin"…).
  "Epsom Leather", "Togo Leather", "Clemence Leather", "Swift Leather",
  "Box Leather", "Barenia Leather", "Evercolor Leather", "Fjord Leather",
  "Chevre Mysore Goatskin", "Chevre Goatskin",
  "Epsom", "Togo", "Clemence", "Swift", "Barenia", "Evercolor", "Fjord",
  "Chevre", "Goatskin", "Ostrich", "Crocodile", "Alligator",
  // Louis Vuitton / Gucci canvases.
  "Monogram Canvas", "Damier Ebene", "Damier Azur", "Damier",
  "GG Supreme Canvas", "GG Canvas", "Microguccissima", "Matelassé", "Matelasse",
  // Chanel & general.
  "Caviar Leather", "Lambskin Leather", "Patent Leather", "Calfskin Leather",
  "Caviar", "Lambskin", "Patent", "Suede", "Tweed", "Jersey", "Calfskin",
  "Lizard", "Python", "Velvet", "Denim", "Wool", "Canvas", "Leather",
];

// Known colours, used to find the colour segment independently of the material
// (TRR lists colour as its own fact, e.g. "Red.", separate from "Caviar Leather").
// Gold/Silver are intentionally excluded — they collide with hardware tone.
const COLORS = [
  "Black", "White", "Beige", "Brown", "Red", "Blue", "Navy", "Pink", "Green",
  "Grey", "Gray", "Burgundy", "Purple", "Yellow", "Orange", "Tan", "Khaki",
  "Metallic", "Neutrals", "Cream", "Ivory", "Multicolor", "Coral", "Turquoise",
  "Bordeaux", "Nude", "Taupe",
  // Hermès / French colour names (the colour prefixes a leather segment, e.g.
  // "Noir Togo Leather"; hardware segments are skipped before this scan so a
  // "Gold" colourway won't be confused with gold hardware).
  "Noir", "Blanc", "Craie", "Etoupe", "Étoupe", "Etain", "Étain", "Gris",
  "Bleu", "Rouge", "Vert", "Rose", "Jaune", "Marron", "Fauve", "Gold",
];

const HARDWARE = /\b(Gold|Silver|Ruthenium|Rose Gold|Gunmetal|Palladium|Brass|Bronze)(?:[- ](?:Tone|Plated))?\s+Hardware/i;

/**
 * TRR files every product under a department in its URL path:
 *   /products/women/handbags/shoulder-bags/<slug>   ← a bag  (KEEP)
 *   /products/men/bags/messenger-bags/<slug>         ← a bag  (KEEP)
 *   /products/women/clothing/tops/<slug>             ← apparel (DROP)
 *   /products/women/shoes/sneakers/<slug>            ← shoes   (DROP)
 *   /products/jewelry/bracelets/<slug>               ← jewelry, gender-less (DROP)
 *   /products/women/accessories/belts/<slug>         ← belt/scarf/sunglasses (DROP)
 *
 * A broad brand keyword search (the Apify + JSON-LD catch-all adapters) returns that
 * house's apparel / shoes / jewelry / watches / accessories alongside its bags. Those
 * non-bag rows can never resolve to a bag style — canonicalModel's SLG/apparel gate
 * (correctly) refuses them a model — so they sit unpromotable in discovered_listing
 * forever and only bloat the promotion scan. We drop them at ingest by reading the
 * category out of the URL path. Segments are exact path tokens (not substrings), so a
 * product slug like "...-belt-bag-vel0m" never trips the "belts" token.
 */
const TRR_BAG_SEGMENTS = new Set(["handbags", "bags"]);
const TRR_NON_BAG_SEGMENTS = new Set([
  // apparel & footwear
  "clothing", "shoes", "suiting-accessories", "sports",
  // jewelry — TRR files it gender-less (/products/jewelry/rings/…), so match the
  // department AND the type tokens in case the parent segment is absent.
  "jewelry", "fine-jewelry", "body-jewelry",
  "bracelet", "bracelets", "necklace", "necklaces", "earring", "earrings",
  "ring", "rings", "brooch", "brooches", "pin", "pins", "cufflinks", "pendant", "pendants",
  // watches
  "watches",
  // accessories (belts / scarves / sunglasses / straps / tech live here)
  "accessories", "strap", "straps", "sunglasses", "scarf", "scarves",
  "belts", "hats", "gloves", "technology", "tech",
  // home & kids
  "home", "decor-and-accessories", "pillows-and-throws", "bedding-and-bath",
  "decor", "furniture", "art", "fine-art",
  "kids", "girls", "boys", "baby",
]);

/** Lowercased path segments of a TRR product URL (empty on a bad/relative URL). */
function trrPathSegments(url: string | null | undefined): string[] {
  if (!url) return [];
  try {
    return new URL(url).pathname.toLowerCase().split("/").filter(Boolean);
  } catch {
    // Not absolute — best-effort split of whatever path-like string arrived.
    return url.toLowerCase().split(/[?#]/)[0].split("/").filter(Boolean);
  }
}

/**
 * True when a TRR listing should be banked as a handbag. Conservative by design:
 *   1. any handbag department segment ("handbags"/"bags") → KEEP,
 *   2. else a clear non-bag department segment → DROP, UNLESS the title is a carried
 *      pouch the catalog ranks (WOC / vanity / belt bag per BAG_OVERRIDES),
 *   3. else (no department signal at all) → KEEP and let the downstream SLG/model gate
 *      decide, so a malformed or category-less URL never silently drops a real bag.
 */
export function isTrrHandbagListing(url: string | null | undefined, title?: string | null): boolean {
  const segs = trrPathSegments(url);
  if (segs.some((s) => TRR_BAG_SEGMENTS.has(s))) return true;
  if (segs.some((s) => TRR_NON_BAG_SEGMENTS.has(s))) return titleHasBagOverride(title);
  return true;
}

export interface TrrSpec {
  color: string | null;
  material: string | null;
  hardwareColor: string | null;
  productionYear: number | null;
  season: string | null; // e.g. "2011-2012"
  vintage: boolean;
  includes: string | null;
}

/** Split a JSON-LD description into fact segments (handles "\n" or " | "). */
function segments(desc: string): string[] {
  return desc
    .replace(/&amp;/g, "&")
    .split(/\n|\s\|\s/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

/** Parse a TRR description string into a structured spec (best-effort; nulls when absent). */
export function parseTrrDescription(desc: string | null | undefined): TrrSpec {
  const spec: TrrSpec = {
    color: null, material: null, hardwareColor: null,
    productionYear: null, season: null, vintage: false, includes: null,
  };
  if (!desc) return spec;
  const segs = segments(desc);
  const joined = segs.join(" | ");

  const season = joined.match(/From the (\d{4}(?:-\d{4})?) Collection/i);
  if (season) {
    spec.season = season[1];
    spec.productionYear = Number(season[1].slice(0, 4));
  }
  spec.vintage = /\bVintage\b/i.test(joined);

  const hw = joined.match(HARDWARE);
  if (hw) spec.hardwareColor = hw[1].toLowerCase().replace(" ", "-");

  const inc = joined.match(/Includes ([^|]+)/i);
  if (inc) spec.includes = inc[1].trim();

  // Colour: first segment (excluding hardware/interior lines) whose first token is
  // a known colour — colour is its own fact, separate from the material segment.
  for (const seg of segs) {
    if (/Hardware|Lining/i.test(seg)) continue;
    const first = seg.split(/[ ,]/)[0];
    if (COLORS.includes(first)) {
      spec.color = first;
      break;
    }
  }
  // Material: first segment naming a known material (independent of colour).
  for (const seg of segs) {
    const mat = MATERIALS.find((m) => new RegExp(`\\b${m}\\b`, "i").test(seg));
    if (mat) {
      spec.material = mat;
      break;
    }
  }
  return spec;
}
