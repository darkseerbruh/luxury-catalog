import { getSupabase } from "./supabase";

/**
 * "Today's deals" — current resale listings priced BELOW their variant's recorded
 * resale median, ranked by how far under the median they sit.
 *
 * HOW IT WORKS (and what the schema supports today):
 *   - A "deal" needs two things per variant: (1) a *current asking listing* and
 *     (2) a *resale median* to measure it against. Both live in `price_history`.
 *   - Migration 0021 added `price_history.price_type` (enum 'listed' | 'sold' |
 *     'auction' | 'retail_msrp' | 'estimate') and `source_url` / `observed_on`.
 *     A current listing = a row with `price_type = 'listed'` (the eBay / TRR /
 *     Vestiaire / Fashionphile ingest adapters write these). The resale median is
 *     the median sale_price across that variant's RESALE rows (listed + sold +
 *     auction, plus legacy null-price_type rows that don't look like retail), which
 *     mirrors the Fair-Market-Range heuristic on the bag page and the
 *     `variant_price_summary` view (0021).
 *   - We compute the median in JS from price_history rather than reading the
 *     `variant_price_summary` materialized view, because the view is human-gated
 *     (0021 may not be applied in a given environment) and this query degrades more
 *     gracefully: if the `price_type` column itself is missing (pre-0021), the read
 *     throws "column does not exist", we catch it, and return [].
 *
 * WHAT'S NEEDED FOR THIS TO RETURN DATA IN PROD:
 *   - Migration 0021 applied (adds `price_type` + `source_url` + `observed_on`).
 *   - At least one `price_type = 'listed'` row priced below the variant's resale
 *     median. Per docs/handoff.md, the eBay adapter is the main producer of
 *     `listed` rows today; TRR/Vestiaire/Fashionphile adapters add more as their
 *     captures load. With zero listed rows the page shows its empty state — it
 *     never errors.
 *
 * RESILIENT BY CONTRACT: any missing env, missing table/column, or query error is
 * caught and yields [] (the cloud build has no DB credentials; prod does).
 */

export interface Deal {
  variantId: number;
  brandName: string;
  styleName: string;
  sizeLabel: string | null;
  /** Lowest current asking listing for the variant, in `currency`. */
  currentPrice: number;
  /** Recorded resale median for the variant, in `currency`. */
  medianPrice: number;
  currency: string | null;
  /** Whole-number percent the current listing sits below the median (e.g. 18 = 18% under). */
  pctUnder: number;
  /** Where the listing was read from, if recorded (for attribution / link-back). */
  sourceUrl: string | null;
  /** Platform the listing was observed on, if recorded (e.g. "eBay"). */
  platform: string | null;
}

/** Mirror of the bag page + 0021 view heuristic: a row is retail (not resale) if
 *  it's an explicit retail_msrp, or a legacy null-type row on a retail platform. */
const RETAIL_PLATFORM_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function embeddedName(relation: unknown): string {
  const row = Array.isArray(relation) ? relation[0] : relation;
  return (row as { name?: string } | null | undefined)?.name ?? "";
}

type PriceRow = {
  variant_id: number;
  sale_price: number | string | null;
  currency: string | null;
  platform: string | null;
  price_type: string | null;
  source_url: string | null;
  observed_on: string | null;
  date_recorded: string | null;
  variant: VariantJoin | VariantJoin[] | null;
};

type VariantJoin = {
  size_label: string | null;
  style:
    | { name: string; brand: { name: string } | { name: string }[] | null }
    | { name: string; brand: { name: string } | { name: string }[] | null }[]
    | null;
};

/**
 * Current resale listings priced below their variant's recorded resale median,
 * ranked by biggest discount (largest `pctUnder` first). Returns at most `limit`.
 * Always returns [] on any failure — never throws.
 */
export async function getDeals(limit = 24): Promise<Deal[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    // One read: every resale price row with its variant → style → brand. Selecting
    // `price_type` means a pre-0021 environment (no such column) throws, which we
    // catch below and turn into []. We over-fetch and group/compute in JS — the
    // catalog is small and this keeps the query a single resilient round trip.
    const { data, error } = await getSupabase()
      .from("price_history")
      .select(
        "variant_id, sale_price, currency, platform, price_type, source_url, observed_on, date_recorded, variant:variant_id(size_label, style:style_id(name, brand:brand_id(name)))"
      )
      .not("sale_price", "is", null)
      .limit(50000);

    if (error || !data) return [];

    // Group rows per variant, splitting resale (for the median) from listed (the
    // current asking prices we hunt deals in).
    type Group = {
      variantId: number;
      resalePrices: number[];
      listed: { price: number; currency: string | null; platform: string | null; sourceUrl: string | null }[];
      brandName: string;
      styleName: string;
      sizeLabel: string | null;
      currency: string | null;
    };
    const groups = new Map<number, Group>();

    for (const row of data as PriceRow[]) {
      const price = row.sale_price != null ? Number(row.sale_price) : null;
      if (price == null || !Number.isFinite(price) || price <= 0) continue;

      const isRetail =
        row.price_type === "retail_msrp" ||
        (row.price_type == null && row.platform != null && RETAIL_PLATFORM_RX.test(row.platform));
      if (isRetail) continue; // retail/MSRP is not the secondary market

      let g = groups.get(row.variant_id);
      if (!g) {
        const variant = (Array.isArray(row.variant) ? row.variant[0] : row.variant) ?? null;
        const style = variant ? (Array.isArray(variant.style) ? variant.style[0] : variant.style) : null;
        g = {
          variantId: row.variant_id,
          resalePrices: [],
          listed: [],
          brandName: style ? embeddedName(style.brand) : "",
          styleName: style?.name ?? "",
          sizeLabel: variant?.size_label ?? null,
          currency: row.currency,
        };
        groups.set(row.variant_id, g);
      }

      // Resale population for the median = listed + sold + auction (+ legacy nulls).
      g.resalePrices.push(price);
      if (row.price_type === "listed") {
        g.listed.push({ price, currency: row.currency, platform: row.platform, sourceUrl: row.source_url });
      }
    }

    const deals: Deal[] = [];
    for (const g of groups.values()) {
      // Need a current listing AND enough resale history for a meaningful median.
      if (g.listed.length === 0 || g.resalePrices.length < 2) continue;

      const med = median(g.resalePrices);
      if (med <= 0) continue;

      // The best (lowest) current listing is the strongest deal for the variant.
      const best = g.listed.reduce((lo, c) => (c.price < lo.price ? c : lo), g.listed[0]);
      if (best.price >= med) continue; // only listings BELOW median are "deals"

      const pctUnder = Math.round(((med - best.price) / med) * 100);
      if (pctUnder <= 0) continue;

      deals.push({
        variantId: g.variantId,
        brandName: g.brandName,
        styleName: g.styleName,
        sizeLabel: g.sizeLabel,
        currentPrice: Math.round(best.price),
        medianPrice: Math.round(med),
        currency: best.currency ?? g.currency,
        pctUnder,
        sourceUrl: best.sourceUrl,
        platform: best.platform,
      });
    }

    return deals.sort((a, b) => b.pctUnder - a.pctUnder).slice(0, Math.max(0, limit));
  } catch {
    // Missing column (pre-0021), missing table, or any other DB error → no deals,
    // never a crash.
    return [];
  }
}
