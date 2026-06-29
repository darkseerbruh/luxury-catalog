/**
 * Side-by-side bag compare (analytics-strategy.md G2).
 *
 * Serves the decision Sofia and the Cross-Shopper actually make ("which of these
 * 2-3?") by lining up the decision-relevant fields per bag. Every field is read
 * from existing honest sources — getVariantDetail (the bag page's own source) and
 * the variant_price_summary view (the cron-maintained low/median/high resale).
 * Nothing here derives or invents a value; the resale read is framed as an
 * estimate from N sold, never a verdict.
 */
import { getSupabase } from "./supabase";
import { getVariantDetail, getVariantImages } from "./queries";

/** Per-variant resale estimate from the variant_price_summary materialized view. */
export interface ResaleSummary {
  low: number | null;
  median: number | null;
  high: number | null;
  sampleSize: number;
  currency: string | null;
}

/** One column in the compare view. Only fields that trace to real data. */
export interface CompareBag {
  variantId: number;
  imageUrl: string | null;
  brandName: string;
  brandTier: string;
  styleName: string;
  silhouette: string | null;
  sizeLabel: string | null;
  material: string | null;
  hardware: string | null;
  years: string | null;
  inProduction: boolean;
  retailPrice: number | null;
  currency: string | null;
  resale: ResaleSummary | null;
}

/** Read low/median/high resale per variant from the view. Degrades to {} pre-0021. */
async function getResaleSummaries(
  ids: number[],
): Promise<Record<number, ResaleSummary>> {
  if (ids.length === 0) return {};
  try {
    const { data, error } = await getSupabase()
      .from("variant_price_summary")
      .select("variant_id, resale_low, resale_median, resale_high, sample_size, currency")
      .in("variant_id", ids);
    if (error || !data) return {};
    const map: Record<number, ResaleSummary> = {};
    for (const r of data as {
      variant_id: number;
      resale_low: number | null;
      resale_median: number | null;
      resale_high: number | null;
      sample_size: number | null;
      currency: string | null;
    }[]) {
      map[r.variant_id] = {
        low: r.resale_low,
        median: r.resale_median,
        high: r.resale_high,
        sampleSize: r.sample_size ?? 0,
        currency: r.currency,
      };
    }
    return map;
  } catch {
    return {};
  }
}

/** Format the year span shown in the compare column. */
function formatYears(start: number | null, end: number | null, inProduction: boolean): string | null {
  if (start == null) return null;
  if (inProduction) return `${start}–present`;
  if (end == null || end === start) return `${start}`;
  return `${start}–${end}`;
}

/**
 * Build the compare columns for up to four variant ids, in the order given.
 * Unknown ids are dropped. Returns [] when fewer than two resolve.
 */
export async function getCompareBags(ids: number[]): Promise<CompareBag[]> {
  const unique = Array.from(new Set(ids.filter((n) => Number.isFinite(n)))).slice(0, 4);
  if (unique.length === 0) return [];

  const [details, images, resale] = await Promise.all([
    Promise.all(unique.map((id) => getVariantDetail(id))),
    getVariantImages(unique),
    getResaleSummaries(unique),
  ]);

  const byId = new Map<number, CompareBag>();
  for (const v of details) {
    if (!v) continue;
    byId.set(v.variantId, {
      variantId: v.variantId,
      imageUrl: images[v.variantId] ?? null,
      brandName: v.brand.name,
      brandTier: v.brand.tier,
      styleName: v.style.name,
      silhouette: v.style.silhouette,
      sizeLabel: v.sizeLabel,
      material: v.exteriorMaterial?.name ?? null,
      hardware:
        [v.hardwareColor, v.hardwareType].filter(Boolean).join(" ") || null,
      years: formatYears(v.yearStart, v.yearEnd, v.stillInProduction),
      inProduction: v.stillInProduction,
      retailPrice: v.retailPriceOriginal,
      currency: v.currency,
      resale: resale[v.variantId] ?? null,
    });
  }

  // Preserve the caller's id order; drop unknowns.
  return unique.map((id) => byId.get(id)).filter((b): b is CompareBag => b != null);
}
