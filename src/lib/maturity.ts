/**
 * Persona model v2 — the Axis-B motivations and Axis-A maturity derivation.
 *
 * Implements docs/personas.md §4 and docs/analytics-strategy.md G1:
 *   - MOTIVATIONS: the five verbs onboarding asks (pick all that apply).
 *   - deriveMaturityStage(): maturity is INFERRED from closet behavior, never
 *     asked, so the persona self-corrects as the user matures.
 *   - motivationsToPersona(): a best-effort map back onto the legacy
 *     `profile.persona` enum, so existing readers keep working.
 */

/** Axis-B motivations (onboarding multi-select). Slug + the label the UI shows. */
export const MOTIVATIONS = [
  { value: "carry", label: "Find a bag I'll love and carry" },
  { value: "value", label: "See what bags are really worth" },
  { value: "authenticate", label: "Tell real from fake" },
  { value: "resell", label: "Buy to resell at a profit" },
  { value: "collect", label: "Track a collection I own" },
] as const;

export type Motivation = (typeof MOTIVATIONS)[number]["value"];

const MOTIVATION_VALUES = MOTIVATIONS.map((m) => m.value) as readonly string[];

/** Keep only recognized motivation slugs, de-duplicated, order preserved. */
export function sanitizeMotivations(raw: readonly string[]): Motivation[] {
  const seen = new Set<string>();
  const out: Motivation[] = [];
  for (const v of raw) {
    if (MOTIVATION_VALUES.includes(v) && !seen.has(v)) {
      seen.add(v);
      out.push(v as Motivation);
    }
  }
  return out;
}

/**
 * Best-effort primary persona for the legacy `profile.persona` enum
 * (collector | flipper | first-purchase | authentication | thrift-hunter).
 * Priority is chosen so the strongest-signal motivation wins when several are
 * picked: resell first (a flipper who also carries is still a flipper), then
 * collect, then authenticate, then value, then carry. Returns null if none.
 */
export function motivationsToPersona(
  motivations: readonly Motivation[],
): string | null {
  if (motivations.includes("resell")) return "flipper";
  if (motivations.includes("collect")) return "collector";
  if (motivations.includes("authenticate")) return "authentication";
  if (motivations.includes("value")) return "collector";
  if (motivations.includes("carry")) return "first-purchase";
  return null;
}

export type MaturityStage =
  | "appreciate"
  | "aspire"
  | "first-purchase"
  | "collector";

/** Closet tallies used to infer maturity. */
export interface ClosetCounts {
  /** Bags marked owned (closet_status 'owned'). */
  owned: number;
  /** Bags saved to want/research (closet_status 'wishlist' or 'researching'). */
  wishlist: number;
}

/**
 * Axis-A maturity derived from closet state (personas.md §4.2):
 *   - several owned          → collector
 *   - at least one owned     → first-purchase
 *   - only saved/wishlisted  → aspire
 *   - nothing yet            → appreciate
 *
 * Reseller maturity is intentionally NOT derived here: it needs sell-click /
 * sold-history signals we do not capture yet (see analytics-strategy.md §6).
 */
export function deriveMaturityStage(counts: ClosetCounts): MaturityStage {
  if (counts.owned >= 3) return "collector";
  if (counts.owned >= 1) return "first-purchase";
  if (counts.wishlist >= 1) return "aspire";
  return "appreciate";
}
