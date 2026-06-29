/**
 * Shared, source-agnostic condition normalisation.
 *
 * Per-source adapters (ebay.ts, fashionphile.ts, vestiaire.ts) keep their own
 * mappers tuned to that site's exact grade vocabulary. THIS module is the generic
 * fallback used for two jobs the per-source mappers don't cover:
 *
 *   1. Backfill — re-deriving a `condition` enum from a free-text wear write-up
 *      (`condition_detail`/`notes`) we already captured but never graded.
 *   2. TheRealReal — turning JSON-LD `offers.itemCondition` (only ever the binary
 *      NewCondition / UsedCondition) into our enum without faking a graded tier.
 *
 * Locked rule (docs/data-collection-handoff.md §1): NEVER invent a grade. Anything
 * ambiguous ("pre-owned", "gently used", "signs of wear", "satisfactory") maps to
 * null so a worn bag can never silently read as a clean one. We only return a tier
 * when the text states one.
 */

import type { SaleCondition } from "./types";

/**
 * Ordered grade matchers, most-specific first. Each entry recognises a grade
 * *phrase* anywhere in the text; order guarantees e.g. "like new" → excellent
 * wins over a bare "new" later, and "very good" wins over "good".
 */
const GRADE_RULES: ReadonlyArray<readonly [RegExp, SaleCondition]> = [
  // ── "new" tier: genuinely unused / store-fresh, stated explicitly ──────────
  [/\bnew\s+with\s+tags?\b/i, "new"],
  [/\bbrand[\s-]?new\b/i, "new"],
  [/\bnever\s+(?:been\s+)?(?:worn|used|carried)\b/i, "new"],
  [/\bunworn\b/i, "new"],
  [/\bnwt\b/i, "new"],
  [/\bgiftable\b/i, "new"], // Fashionphile "Giftable" = store-quality / like-new
  [/^new$/i, "new"],

  // ── "excellent" tier: like-new / pristine, light or no signs ───────────────
  [/\blike[\s-]?new\b/i, "excellent"],
  [/\bpristine\b/i, "excellent"],
  [/\bexcellent\b/i, "excellent"],

  // ── lower graded tiers, stated explicitly ──────────────────────────────────
  [/\bvery\s+good\b/i, "very good"],
  [/\bgood\s+condition\b/i, "good"],
  [/^good$/i, "good"],
  [/\bfair\s+condition\b/i, "fair"],
  [/\bpre.?owned\s+fair\b/i, "fair"],
  [/^fair$/i, "fair"],
];

/**
 * Map a free-text condition/wear string from ANY source to our SaleCondition
 * enum. Conservative by design: returns null unless the text names a grade.
 *
 * Handles schema.org itemCondition URLs (JSON-LD) too: NewCondition → new,
 * everything else (Used/Refurbished) → null (too broad to grade).
 */
export function mapConditionText(raw: string | null | undefined): SaleCondition | null {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  // schema.org itemCondition URL (e.g. "https://schema.org/UsedCondition")
  if (/schema\.org/i.test(text)) {
    if (/newcondition/i.test(text) && !/likenewcondition/i.test(text)) return "new";
    if (/likenewcondition/i.test(text)) return "excellent";
    return null; // UsedCondition / RefurbishedCondition / DamagedCondition → too broad
  }

  for (const [re, grade] of GRADE_RULES) {
    if (re.test(text)) return grade;
  }
  return null;
}

/**
 * Map TheRealReal's JSON-LD `offers.itemCondition` to our enum. TRR only ever
 * exposes the schema.org binary (NewCondition / UsedCondition) here — the graded
 * wear write-up lives in a separate product-page section, not the JSON-LD — so we
 * tag genuinely-new listings "new" and leave used ones null (never fake a grade).
 */
export function mapTrrItemCondition(raw: string | null | undefined): SaleCondition | null {
  if (!raw) return null;
  return /new/i.test(String(raw)) ? "new" : null;
}
