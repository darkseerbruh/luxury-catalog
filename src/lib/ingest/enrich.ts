/**
 * Condition-enrichment via LLM extraction. Reseller condition write-ups are free
 * text ("light corner wear, minor hardware tarnish, includes box & dust bag");
 * this turns them into the structured sub-signals the condition ladder needs
 * (docs viz requirements, Tier 2). Pure prompt + validated parser here; the
 * Anthropic call + DB update live in supabase/ingest/enrich-conditions.ts.
 *
 * Guardrail: extract ONLY what the text states — never infer/invent. Anything
 * unstated stays null (matches the catalog's accuracy-over-completeness rule).
 */

export type WearLevel = "none" | "minor" | "moderate" | "heavy";

export interface ConditionEnrichment {
  corner_wear: WearLevel | null;
  interior_staining: WearLevel | null;
  hardware_tarnish: boolean | null;
  odor: boolean | null;
  repaint_or_restoration: boolean | null;
  full_set: boolean | null; // box + dust bag + authenticity card all present
  authenticity_card: boolean | null;
}

const WEAR: ReadonlySet<string> = new Set(["none", "minor", "moderate", "heavy"]);
const WEAR_FIELDS = ["corner_wear", "interior_staining"] as const;
const BOOL_FIELDS = ["hardware_tarnish", "odor", "repaint_or_restoration", "full_set", "authenticity_card"] as const;

export const EMPTY_ENRICHMENT: ConditionEnrichment = {
  corner_wear: null, interior_staining: null, hardware_tarnish: null,
  odor: null, repaint_or_restoration: null, full_set: null, authenticity_card: null,
};

/** Build the extraction prompt for a listing's condition/description text. */
export function buildEnrichmentPrompt(text: string): string {
  return [
    "Extract structured condition signals from this resale listing text.",
    "Return ONLY a JSON object with these keys:",
    '  corner_wear, interior_staining: one of "none"|"minor"|"moderate"|"heavy" or null',
    "  hardware_tarnish, odor, repaint_or_restoration, full_set, authenticity_card: true | false | null",
    'full_set = box AND dust bag AND authenticity card all present.',
    "Use null for anything the text does not state. Do NOT guess or infer. No prose, JSON only.",
    "",
    "Listing text:",
    text.slice(0, 2000),
  ].join("\n");
}

/**
 * Parse + validate the model's JSON reply into a ConditionEnrichment (tolerates
 * code fences / surrounding prose). Invalid → null so bad output is never stored.
 */
export function parseEnrichmentResponse(raw: string): ConditionEnrichment | null {
  if (!raw) return null;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const out: ConditionEnrichment = { ...EMPTY_ENRICHMENT };
  for (const f of WEAR_FIELDS) {
    const v = obj[f];
    if (typeof v === "string" && WEAR.has(v)) out[f] = v as WearLevel;
  }
  for (const f of BOOL_FIELDS) {
    const v = obj[f];
    if (typeof v === "boolean") out[f] = v;
  }
  return out;
}
