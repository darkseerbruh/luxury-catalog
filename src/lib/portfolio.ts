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

export async function getClosetValue(): Promise<ClosetValue | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const closet = await getCloset();
    const have = closet.filter((c) => c.status === "have");
    if (have.length === 0) return null;

    const ids = have.map((c) => c.variantId);
    const { data, error } = await getSupabase()
      .from("price_history")
      .select("variant_id, sale_price, platform, price_type")
      .in("variant_id", ids)
      .not("sale_price", "is", null)
      .limit(20000);
    if (error || !data) return null;

    // Resale population per variant (exclude retail/MSRP), mirroring deals.ts.
    const byVariant = new Map<number, number[]>();
    for (const row of data as {
      variant_id: number;
      sale_price: number | string | null;
      platform: string | null;
      price_type: string | null;
    }[]) {
      const price = row.sale_price != null ? Number(row.sale_price) : null;
      if (price == null || !Number.isFinite(price) || price <= 0) continue;
      const isRetail =
        row.price_type === "retail_msrp" ||
        (row.price_type == null && row.platform != null && RETAIL_PLATFORM_RX.test(row.platform));
      if (isRetail) continue;
      const arr = byVariant.get(row.variant_id) ?? [];
      arr.push(price);
      byVariant.set(row.variant_id, arr);
    }

    let total = 0;
    let valued = 0;
    for (const c of have) {
      const prices = byVariant.get(c.variantId);
      if (prices && prices.length >= 2) {
        total += median(prices);
        valued += 1;
      }
    }
    if (valued === 0) return null;

    return { count: have.length, valued, total: Math.round(total), currency: have[0].currency };
  } catch {
    return null;
  }
}
