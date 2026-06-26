/**
 * Style-level "shop this bag" data for an article's topic. The article carries a
 * topic_style_id; this aggregates the LIVE listed offers across that style's size
 * variants into one compact, decision-useful summary (how many are listed, from what
 * price, the median) plus a few of the freshest individual listings with their own
 * source URL. Powers the in-article ShopThisBag card (sticky + inline). Resilient:
 * any failure (missing env, un-migrated DB) yields null so the article still renders.
 *
 * Freshness note: these are listed (asking) rows from our captures, dated by
 * observed_on. Until the recurring re-capture / product-feed refresh lands, treat the
 * figures as "as of" their capture date (we surface that date in the card).
 */
import { getSupabase } from "./supabase";
import { PLATFORMS } from "./platforms";

export interface ShopOffer {
  price: number;
  currency: string;
  sizeLabel: string | null;
  platform: string | null;
  platformLabel: string;
  sourceUrl: string | null;
  observedOn: string | null;
}

export interface StyleShopData {
  count: number;
  fromPrice: number; // lowest live asking
  medianPrice: number;
  currency: string;
  asOf: string | null; // most recent observed_on across the live offers
  offers: ShopOffer[]; // a few freshest, for individual "view" links
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

const platformLabel = (p: string | null): string =>
  (p && PLATFORMS[p as keyof typeof PLATFORMS]?.label) || p || "Resale";

export async function getStyleShopData(styleId: number | null): Promise<StyleShopData | null> {
  if (!styleId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !Number.isFinite(styleId)) return null;
  try {
    const db = getSupabase();
    const { data: vars, error: vErr } = await db
      .from("variant")
      .select("variant_id, size_label")
      .eq("style_id", styleId);
    if (vErr || !vars || vars.length === 0) return null;
    const sizeOf = new Map<number, string | null>(vars.map((v: { variant_id: number; size_label: string | null }) => [v.variant_id, v.size_label]));
    const variantIds = vars.map((v: { variant_id: number }) => v.variant_id);

    const { data, error } = await db
      .from("price_history")
      .select("variant_id, sale_price, currency, platform, source_url, observed_on, listing_ref, price_type, listing_status")
      .in("variant_id", variantIds)
      .eq("price_type", "listed")
      .not("sale_price", "is", null)
      .limit(10000);
    if (error || !data) return null;

    // Live = listed and not retired. Dedup by listing_ref, keeping the latest observation.
    type Row = { variant_id: number; sale_price: number | string | null; currency: string | null; platform: string | null; source_url: string | null; observed_on: string | null; listing_ref: string | null; listing_status: string | null };
    const byRef = new Map<string, Row>();
    for (const r of data as Row[]) {
      if (r.listing_status === "sold") continue;
      const price = r.sale_price != null ? Number(r.sale_price) : NaN;
      if (!Number.isFinite(price) || price <= 0) continue;
      const key = r.listing_ref || r.source_url || `${r.variant_id}|${price}|${r.observed_on}`;
      const prev = byRef.get(key);
      if (!prev || (r.observed_on ?? "") > (prev.observed_on ?? "")) byRef.set(key, r);
    }
    const rows = [...byRef.values()];
    if (rows.length === 0) return null;

    const prices = rows.map((r) => Number(r.sale_price));
    const currency = (rows[0].currency || "USD").toString();
    const asOf = rows.reduce<string | null>((max, r) => ((r.observed_on ?? "") > (max ?? "") ? r.observed_on : max), null);

    // The 3 surfaced "view" links are the actual affiliate clicks, so prefer sources whose
    // live status is genuinely maintained: Fashionphile is re-crawled + retired every few hours
    // (headless), so a still-shown Fashionphile listing is very likely live. eBay/Poshmark/TRR
    // rows only flip to sold on the browser-gated re-capture, so they go stale fastest and a
    // "view" click can land on a sold page (dead affiliate click). Rank reliable-live first,
    // then freshest observation, then lowest price. This re-ranks the 3 links only; the count +
    // median (dated by asOf) still reflect every live row.
    const liveReliability = (p: string | null): number => (p === "fashionphile" ? 0 : p === "therealreal" ? 1 : 2);
    const offers: ShopOffer[] = rows
      .filter((r) => r.source_url)
      .sort(
        (a, b) =>
          liveReliability(a.platform) - liveReliability(b.platform) ||
          (b.observed_on ?? "").localeCompare(a.observed_on ?? "") ||
          Number(a.sale_price) - Number(b.sale_price),
      )
      .slice(0, 3)
      .map((r) => ({
        price: Number(r.sale_price),
        currency: (r.currency || "USD").toString(),
        sizeLabel: sizeOf.get(r.variant_id) ?? null,
        platform: r.platform,
        platformLabel: platformLabel(r.platform),
        sourceUrl: r.source_url,
        observedOn: r.observed_on,
      }));

    return {
      count: rows.length,
      fromPrice: Math.min(...prices),
      medianPrice: median(prices),
      currency,
      asOf,
      offers,
    };
  } catch {
    return null;
  }
}
