/**
 * Item-spec extraction via LLM. Resale listing titles/descriptions bury the spec
 * that drives like-for-like value — production year, colour, material, hardware,
 * season ("Chanel Classic Flap Medium black caviar gold hw, 2016, series 23").
 * This turns that free text into the structured columns the era×condition matrix
 * and attribute grading need (migration 0022). Pure prompt + validated parser
 * here; the Anthropic call + DB update live in supabase/ingest/enrich-specs.ts.
 *
 * Guardrail: extract ONLY what the text states — never infer a year from "looks
 * older", never guess a colour. Anything unstated stays null (matches the
 * catalog's never-invent / accuracy-over-completeness rule).
 */

export interface ItemSpec {
  /** 4-digit production/collection start year stated in the listing. */
  production_year: number | null;
  /** Collection/season label, e.g. "2011-2012", when stated. */
  season: string | null;
  colorway: string | null;
  material: string | null;
  hardware_color: string | null;
}

export const EMPTY_SPEC: ItemSpec = {
  production_year: null,
  season: null,
  colorway: null,
  material: null,
  hardware_color: null,
};

const STRING_FIELDS = ["season", "colorway", "material", "hardware_color"] as const;

/** Plausible production-year window; anything outside is treated as a hallucination. */
const MIN_YEAR = 1950;
const maxYear = () => new Date().getFullYear() + 1;

/** Build the extraction prompt for a listing's title + description text. */
export function buildSpecPrompt(text: string): string {
  return [
    "Extract the item spec from this resale listing title/description.",
    "Return ONLY a JSON object with these keys:",
    "  production_year: the 4-digit year the bag was produced, if explicitly stated (or derivable from an explicit date code/series the text spells out); else null",
    '  season: a collection/season label like "2011-2012" if stated; else null',
    "  colorway: the exterior colour (e.g. Black, Beige) if stated; else null",
    "  material: the leather/material (e.g. Caviar, Lambskin) if stated; else null",
    "  hardware_color: the hardware tone (gold, silver, ruthenium…) if stated; else null",
    "Use null for anything the text does not state. Do NOT guess or infer from style. No prose, JSON only.",
    "",
    "Listing text:",
    text.slice(0, 2000),
  ].join("\n");
}

function cleanString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > 60) return null;
  return s;
}

/**
 * Parse + validate the model's JSON reply into an ItemSpec (tolerates code
 * fences / surrounding prose). Out-of-range years and non-strings drop to null so
 * bad output is never stored. Returns null only when there's no JSON at all.
 */
export function parseSpecResponse(raw: string): ItemSpec | null {
  if (!raw) return null;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const out: ItemSpec = { ...EMPTY_SPEC };

  const year = obj.production_year;
  if (typeof year === "number" && Number.isInteger(year) && year >= MIN_YEAR && year <= maxYear()) {
    out.production_year = year;
  }
  for (const f of STRING_FIELDS) {
    out[f] = cleanString(obj[f]);
  }
  return out;
}
