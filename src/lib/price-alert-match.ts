/**
 * Pure matching for spec-scoped price alerts ("any green Chanel 19").
 *
 * When a watched want carries a want_spec (a colour family, or any colourway), the
 * alert should fire on ANY variant of the style that matches the spec and sits at
 * least `pct`% below its own median resale price. This is the pure core; the cron
 * (src/app/api/cron/price-alerts/route.ts) supplies the candidates from the DB.
 */

import { colorFamily } from "./listings-taxonomy";

/** Minimum resale comps before a median is trustworthy enough to alert on. */
export const MIN_MEDIAN_SAMPLE = 5;

export interface AlertPriceRow {
  sale_price: number | null;
  date_recorded: string;
  currency: string | null;
  price_type?: string | null;
}

export interface SpecCandidate {
  variantId: number;
  colorway: string | null;
  prices: AlertPriceRow[];
}

export type AlertSpec = { colorFamily?: string; anyColor?: boolean };

export interface SpecHit {
  variantId: number;
  price: number;
  currency: string | null;
  off: number;
  median: number;
}

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** True if a candidate's colourway satisfies the spec. */
export function candidateMatchesSpec(colorway: string | null, spec: AlertSpec): boolean {
  if (spec.anyColor) return true;
  if (spec.colorFamily) return colorFamily(colorway) === spec.colorFamily;
  return false;
}

/**
 * Best spec match across the style's variants, or null. "Best" = the deepest
 * discount below median. Each candidate is judged against its OWN median (a mini
 * is not compared to a maxi). `cutoff` is the alert's last_notified date.
 */
export function matchSpecAlert(
  candidates: SpecCandidate[],
  spec: AlertSpec,
  pct: number,
  cutoff: string | null,
): SpecHit | null {
  if (pct <= 0) return null;
  let best: SpecHit | null = null;
  for (const c of candidates) {
    if (!candidateMatchesSpec(c.colorway, spec)) continue;
    const comps = c.prices
      .filter((p) => p.sale_price != null && p.price_type !== "retail")
      .map((p) => Number(p.sale_price));
    if (comps.length < MIN_MEDIAN_SAMPLE) continue;
    const med = median(comps);
    const threshold = med * (1 - pct / 100);
    const fresh = c.prices.filter(
      (p) =>
        p.sale_price != null &&
        Number(p.sale_price) <= threshold &&
        (!cutoff || p.date_recorded > cutoff.slice(0, 10)),
    );
    if (fresh.length === 0) continue;
    const lo = fresh.reduce((a, b) => (Number(b.sale_price) < Number(a.sale_price) ? b : a));
    const price = Number(lo.sale_price);
    const off = Math.round((1 - price / med) * 100);
    if (!best || off > best.off) best = { variantId: c.variantId, price, currency: lo.currency, off, median: med };
  }
  return best;
}
