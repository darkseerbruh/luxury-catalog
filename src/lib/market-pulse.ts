import { unstable_cache } from "next/cache";
import { getSupabase, fetchAllRows } from "./supabase";
import { CACHE_MARKET } from "./cache";

/**
 * Market pulse — the "data behind every page" numbers. Deliberately built on the
 * BROAD price dataset (every observation, every house), not the thin retail-anchor
 * subset, so it states our scale honestly without ranking famous bags. Every figure
 * traces to a live count; nothing is illustrative.
 *
 * Cached (price data changes on ingest, not per request); used by the /data page
 * and the homepage "data" tile.
 */

export interface HouseDepth {
  name: string;
  observations: number;
}

export interface MarketPulse {
  /** Total price observations on record (every price_history row). */
  totalPrices: number;
  /** Bag variants in the catalog. */
  bags: number;
  /** Houses (brands) we cover. */
  houses: number;
  /** Earliest year any price is dated to (the dataset's reach, not our tenure). */
  earliestYear: number | null;
  /** Resale observations per house, deepest first. */
  byHouse: HouseDepth[];
  /** Typical resale price per house (median of that house's per-style medians), priciest first. */
  medianByHouse: HousePrice[];
}

export interface HousePrice {
  name: string;
  median: number;
  variants: number;
}

const EMPTY: MarketPulse = { totalPrices: 0, bags: 0, houses: 0, earliestYear: null, byHouse: [], medianByHouse: [] };

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0;
};

type BrandRel = { name: string } | { name: string }[] | null;
type StyleRel = { brand: BrandRel } | { brand: BrandRel }[] | null;

function brandNameOf(style: StyleRel): string {
  const s = Array.isArray(style) ? style[0] : style;
  const b = s ? (Array.isArray(s.brand) ? s.brand[0] : s.brand) : null;
  return b?.name ?? "";
}

async function loadMarketPulse(): Promise<MarketPulse> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return EMPTY;
  try {
    const sb = getSupabase();
    const [pricesRes, bagsRes, housesRes, earliestRes, summaryRes, variants] = await Promise.all([
      sb.from("price_history").select("*", { count: "exact", head: true }),
      sb.from("variant").select("*", { count: "exact", head: true }),
      sb.from("brand").select("*", { count: "exact", head: true }),
      sb
        .from("price_history")
        .select("observed_on")
        .not("observed_on", "is", null)
        .order("observed_on", { ascending: true })
        .limit(1),
      sb.rpc("variant_price_summary"),
      fetchAllRows<{ variant_id: number; style: StyleRel }>(() =>
        sb.from("variant").select("variant_id, style:style_id(brand:brand_id(name))"),
      ),
    ]);

    // Resale observations per house: sum the per-variant resale counts by brand.
    const brandOf = new Map<number, string>();
    for (const v of variants) {
      const name = brandNameOf(v.style);
      if (name) brandOf.set(v.variant_id, name);
    }
    const tally = new Map<string, number>();
    const priceGroups = new Map<string, number[]>();
    if (!summaryRes.error && summaryRes.data) {
      for (const s of summaryRes.data as { variant_id: number; resale_n: number | null; resale_median: number | string | null }[]) {
        const name = brandOf.get(s.variant_id);
        if (!name) continue;
        tally.set(name, (tally.get(name) ?? 0) + (s.resale_n ?? 0));
        const med = s.resale_median != null ? Number(s.resale_median) : 0;
        if (med > 0) (priceGroups.get(name) ?? priceGroups.set(name, []).get(name)!).push(med);
      }
    }
    const byHouse = [...tally.entries()]
      .map(([name, observations]) => ({ name, observations }))
      .filter((h) => h.observations > 0)
      .sort((a, b) => b.observations - a.observations);

    // Typical price per house = median of that house's per-style medians. Require >=3
    // priced styles so a house is not ranked on one bag; priciest first (the market ladder).
    const medianByHouse = [...priceGroups.entries()]
      .filter(([, meds]) => meds.length >= 3)
      .map(([name, meds]) => ({ name, median: Math.round(median(meds)), variants: meds.length }))
      .sort((a, b) => b.median - a.median);

    const earliestOn = (earliestRes.data?.[0] as { observed_on: string } | undefined)?.observed_on ?? null;
    const earliestYear = earliestOn ? Number(earliestOn.slice(0, 4)) || null : null;

    return {
      totalPrices: pricesRes.count ?? 0,
      bags: bagsRes.count ?? 0,
      houses: housesRes.count ?? 0,
      earliestYear,
      byHouse,
      medianByHouse,
    };
  } catch {
    return EMPTY;
  }
}

export const getMarketPulse = unstable_cache(loadMarketPulse, ["market-pulse"], {
  revalidate: CACHE_MARKET,
  tags: ["market"],
});
