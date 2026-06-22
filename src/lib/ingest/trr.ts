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

const MATERIALS = [
  "Caviar Leather", "Lambskin Leather", "Patent Leather", "Calfskin Leather",
  "Caviar", "Lambskin", "Patent", "Suede", "Tweed", "Jersey", "Calfskin",
  "Lizard", "Python", "Velvet", "Denim", "Wool", "Canvas", "Leather",
];

const HARDWARE = /\b(Gold|Silver|Ruthenium|Rose Gold|Gunmetal|Palladium|Brass|Bronze)(?:-Tone)?\s+Hardware/i;

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

  // Colour + leather: the segment naming a known material; colour = words before it.
  for (const seg of segs) {
    if (/Lining/i.test(seg)) continue; // interior line, not exterior colour
    const mat = MATERIALS.find((m) => new RegExp(`\\b${m}\\b`, "i").test(seg));
    if (mat) {
      spec.material = mat;
      const before = seg.slice(0, seg.toLowerCase().indexOf(mat.toLowerCase())).trim();
      // colour is the trailing capitalised word(s) before the material
      const colourMatch = before.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/);
      if (colourMatch) spec.color = colourMatch[1];
      break;
    }
  }
  return spec;
}
