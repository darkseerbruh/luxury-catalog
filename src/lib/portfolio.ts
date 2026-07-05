import { getSupabase } from "./supabase";
import { getCloset } from "./collections";

/**
 * Estimated resale value of the current user's collection — the real number that
 * makes the homepage "Collect & invest" tile SHOW its value instead of describing
 * it. Sums the recorded resale median of each bag the user marks "have".
 *
 * Honest by construction: only bags with enough resale history (>= 2 observations)
 * are valued, and we report how many of the collection that covers, so the figure
 * is never a fabricated total. RESILIENT: any missing env / pre-0021 column / query
 * error yields null, and the tile falls back to its illustrative visual.
 */

const RETAIL_PLATFORM_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface ClosetValue {
  /** Total bags marked "have". */
  count: number;
  /** How many of those we could put a resale estimate on. */
  valued: number;
  /** Summed resale median across the valued bags, in `currency`. */
  total: number;
  currency: string | null;
}

export interface VariantResaleEstimate {
  median: number;
  count: number;
  currency: string | null;
}

/**
 * Per-variant resale medians for a set of variants: the ONE value engine the
 * closet header, the collection report, and the homepage tile all share (they
 * used to disagree — the tile summed resale medians while /closet and the
 * report summed original retail). Only variants with >= 2 resale observations
 * get an estimate; the median is computed within the variant's dominant
 * currency so mixed-currency rows never blend into one number. RESILIENT:
 * errors return an empty map and callers fall back.
 */
export async function getResaleMedians(
  variantIds: number[],
): Promise<Map<number, VariantResaleEstimate>> {
  const out = new Map<number, VariantResaleEstimate>();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || variantIds.length === 0) return out;
  try {
    const { data, error } = await getSupabase()
      .from("price_history")
      .select("variant_id, sale_price, platform, price_type, currency")
      .in("variant_id", variantIds)
      .not("sale_price", "is", null)
      .limit(20000);
    if (error || !data) return out;

    // Resale population per variant + currency (exclude retail/MSRP).
    const byVariant = new Map<number, Map<string, number[]>>();
    for (const row of data as {
      variant_id: number;
      sale_price: number | string | null;
      platform: string | null;
      price_type: string | null;
      currency: string | null;
    }[]) {
      const price = row.sale_price != null ? Number(row.sale_price) : null;
      if (price == null || !Number.isFinite(price) || price <= 0) continue;
      const isRetail =
        row.price_type === "retail_msrp" ||
        (row.price_type == null && row.platform != null && RETAIL_PLATFORM_RX.test(row.platform));
      if (isRetail) continue;
      const cur = row.currency ?? "USD";
      const perCur = byVariant.get(row.variant_id) ?? new Map<string, number[]>();
      const arr = perCur.get(cur) ?? [];
      arr.push(price);
      perCur.set(cur, arr);
      byVariant.set(row.variant_id, perCur);
    }

    for (const [variantId, perCur] of byVariant) {
      // Dominant currency = the one with the most observations.
      let bestCur: string | null = null;
      let bestArr: number[] = [];
      for (const [cur, arr] of perCur) {
        if (arr.length > bestArr.length) {
          bestCur = cur;
          bestArr = arr;
        }
      }
      if (bestArr.length >= 2) {
        out.set(variantId, {
          median: Math.round(median(bestArr)),
          count: bestArr.length,
          currency: bestCur,
        });
      }
    }
    return out;
  } catch {
    return out;
  }
}

export async function getClosetValue(): Promise<ClosetValue | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const closet = await getCloset();
    const have = closet.filter((c) => c.status === "have");
    if (have.length === 0) return null;

    const medians = await getResaleMedians(have.map((c) => c.variantId));

    let total = 0;
    let valued = 0;
    for (const c of have) {
      const est = medians.get(c.variantId);
      if (est) {
        total += est.median;
        valued += 1;
      }
    }
    if (valued === 0) return null;

    return { count: have.length, valued, total: Math.round(total), currency: have[0].currency };
  } catch {
    return null;
  }
}

export interface ClosetValuePoint {
  takenOn: string;
  total: number;
  currency: string | null;
}

/**
 * The signed-in user's closet-value history (closet_value_snapshot, migration
 * 0043, written weekly by the closet-snapshots cron). RESILIENT: pre-migration
 * or any error returns [] and the closet simply shows no sparkline.
 */
export async function getClosetValueHistory(): Promise<ClosetValuePoint[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const { createServerSupabase } = await import("./supabase/server");
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("closet_value_snapshot")
      .select("taken_on, total, currency")
      .order("taken_on", { ascending: true })
      .limit(120);
    if (error || !data) return [];
    return (data as { taken_on: string; total: number | string; currency: string | null }[]).map(
      (r) => ({ takenOn: r.taken_on, total: Number(r.total), currency: r.currency }),
    );
  } catch {
    return [];
  }
}
