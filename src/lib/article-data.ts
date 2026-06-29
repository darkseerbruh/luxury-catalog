/**
 * Live medians for article charts. The data-article charts used to hold hardcoded
 * numbers; these helpers let a chart read its figures from prod `price_history` at
 * render time so it self-updates whenever the data is re-captured. Each chart keeps
 * its captured numbers as a FALLBACK (used when a variant has no rows yet, or env/DB
 * is unavailable), so a chart never renders empty.
 *
 * Honest scope: this updates the CHART only. Article PROSE also cites figures in
 * freeform text; those are kept honest by the periodic drift check
 * (docs/article-freshness-report.md), not by this helper.
 */
import { getSupabase } from "./supabase";

export interface Stat {
  median: number;
  n: number;
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/**
 * Median + count per variant for a price type ('listed' asking or 'sold' realized).
 * Sold excludes nothing extra; listed excludes retired ('sold') rows. Returns {} on any
 * failure so callers fall back to their baked-in numbers.
 */
export async function getMedians(
  variantIds: number[],
  priceType: "listed" | "sold",
): Promise<Record<number, Stat>> {
  const ids = variantIds.filter((n) => Number.isFinite(n));
  if (!ids.length || !process.env.NEXT_PUBLIC_SUPABASE_URL) return {};
  try {
    const db = getSupabase();
    const byVariant: Record<number, number[]> = {};
    // page through in case a single variant has many rows
    let from = 0;
    for (;;) {
      const { data, error } = await db
        .from("price_history")
        .select("variant_id, sale_price, listing_status")
        .in("variant_id", ids)
        .eq("price_type", priceType)
        .not("sale_price", "is", null)
        .range(from, from + 999);
      if (error || !data) break;
      for (const r of data as { variant_id: number; sale_price: number | string | null; listing_status: string | null }[]) {
        if (priceType === "listed" && r.listing_status === "sold") continue;
        const p = r.sale_price != null ? Number(r.sale_price) : NaN;
        if (!Number.isFinite(p) || p <= 0) continue;
        (byVariant[r.variant_id] ??= []).push(p);
      }
      if (data.length < 1000) break;
      from += 1000;
    }
    const out: Record<number, Stat> = {};
    for (const [vid, arr] of Object.entries(byVariant)) out[Number(vid)] = { median: median(arr), n: arr.length };
    return out;
  } catch {
    return {};
  }
}

/** Convenience: a single variant's stat, or null. */
export async function getMedian(variantId: number, priceType: "listed" | "sold"): Promise<Stat | null> {
  const all = await getMedians([variantId], priceType);
  return all[variantId] ?? null;
}
