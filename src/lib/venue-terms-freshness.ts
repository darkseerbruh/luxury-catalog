/**
 * Freshness accounting for the venue-terms data (seller fees on /where-to-sell and
 * buyer protections on /where-to-buy). Those are HARD facts: each cell is a published
 * figure or policy with a source URL and a `checkedAt` date. "Never stale" means every
 * cell gets re-verified on a cadence; this module is the shared backbone that says which
 * cells are due, given a date. Pure, no IO, so the CI guard, the report writer, and the
 * monthly re-verify agent all read the same truth.
 */
import { SELL_VENUES } from "./where-to-sell";
import { VENUES } from "./where-to-buy";

export interface DatedCell {
  surface: "sell" | "buy";
  venueSlug: string;
  venueLabel: string;
  /** Which fact on the venue, e.g. "payoutSpeed", "authentication". */
  field: string;
  claim: string;
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) the cell was last confirmed on the venue's own page. */
  checkedAt: string;
}

/** Every sourced, dated cell across both venue registries, in a flat list. */
export function collectDatedCells(): DatedCell[] {
  const cells: DatedCell[] = [];

  for (const v of SELL_VENUES) {
    const push = (field: string, fact: { claim: string; sourceUrl: string; checkedAt: string } | null | undefined) => {
      if (fact) cells.push({ surface: "sell", venueSlug: v.slug, venueLabel: v.label, field, claim: fact.claim, sourceUrl: fact.sourceUrl, checkedAt: fact.checkedAt });
    };
    push("payoutSpeed", v.payoutSpeed.fact);
    push("payoutMethods", v.payoutMethods.fact);
    push("acceptance", v.acceptance.fact);
    push("effort", v.effort.fact);
    push("priceControl", v.priceControl.fact);
    push("sellerAuth", v.sellerAuth.fact);
    push("buyout", v.buyout?.fact ?? null);
  }

  for (const v of VENUES) {
    const push = (field: string, fact: { claim: string; sourceUrl: string; checkedAt: string } | null | undefined) => {
      if (fact) cells.push({ surface: "buy", venueSlug: v.slug, venueLabel: v.label, field, claim: fact.claim, sourceUrl: fact.sourceUrl, checkedAt: fact.checkedAt });
    };
    push("authentication", v.authentication.fact);
    push("returns", v.returns.fact);
    push("paymentProtection", v.paymentProtection.fact);
    push("fakeRemedy", v.fakeRemedy?.fact ?? null);
  }

  return cells;
}

/** Whole days between two ISO dates (asOf - checkedAt), floored, min 0. */
export function ageInDays(checkedAt: string, asOfIso: string): number {
  const then = Date.parse(`${checkedAt}T00:00:00Z`);
  const now = Date.parse(`${asOfIso}T00:00:00Z`);
  if (!Number.isFinite(then) || !Number.isFinite(now)) return 0;
  return Math.max(0, Math.floor((now - then) / 86_400_000));
}

export interface FreshnessResult {
  asOf: string;
  cadenceDays: number;
  total: number;
  /** Cells at or past the cadence, oldest first. */
  due: Array<DatedCell & { ageDays: number }>;
  oldestAgeDays: number | null;
}

/**
 * Which cells are due for re-verification as of `asOfIso`, given a cadence in days.
 * Deterministic: pass asOf explicitly (the runner passes today; tests pin a date).
 */
export function assessFreshness(
  asOfIso: string,
  cadenceDays = 30,
  cells: DatedCell[] = collectDatedCells(),
): FreshnessResult {
  const withAge = cells.map((c) => ({ ...c, ageDays: ageInDays(c.checkedAt, asOfIso) }));
  const due = withAge
    .filter((c) => c.ageDays >= cadenceDays)
    .sort((a, b) => b.ageDays - a.ageDays);
  const oldestAgeDays = withAge.length ? Math.max(...withAge.map((c) => c.ageDays)) : null;
  return { asOf: asOfIso, cadenceDays, total: cells.length, due, oldestAgeDays };
}

/** Due cells grouped by venue, for a readable report. */
export function dueByVenue(result: FreshnessResult): Array<{
  surface: "sell" | "buy";
  venueSlug: string;
  venueLabel: string;
  oldestAgeDays: number;
  cells: Array<{ field: string; sourceUrl: string; checkedAt: string; ageDays: number }>;
}> {
  const map = new Map<string, ReturnType<typeof dueByVenue>[number]>();
  for (const c of result.due) {
    const key = `${c.surface}:${c.venueSlug}`;
    let g = map.get(key);
    if (!g) {
      g = { surface: c.surface, venueSlug: c.venueSlug, venueLabel: c.venueLabel, oldestAgeDays: 0, cells: [] };
      map.set(key, g);
    }
    g.cells.push({ field: c.field, sourceUrl: c.sourceUrl, checkedAt: c.checkedAt, ageDays: c.ageDays });
    g.oldestAgeDays = Math.max(g.oldestAgeDays, c.ageDays);
  }
  return Array.from(map.values()).sort((a, b) => b.oldestAgeDays - a.oldestAgeDays);
}
