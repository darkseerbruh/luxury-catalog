import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

/** A saved bag (closet or watchlist) resolved for list display. */
export interface SavedBag {
  variantId: number;
  brandName: string;
  styleName: string;
  label: string;
  hardwareColor: string | null;
  retailPrice: number | null;
  currency: string | null;
}

export interface ClosetEntry extends SavedBag {
  status: string;
  note: string | null;
}

export interface WatchlistEntry extends SavedBag {
  targetPrice: number | null;
  alertEnabled: boolean;
  /** "absolute" (dollar target) or "pct_below_median" (deal-hunting default). */
  alertMode: "absolute" | "pct_below_median";
  /** Percent below the typical resale price, when alertMode is pct_below_median. */
  alertPct: number | null;
  /** Most recent recorded sale price, for "is it near my target?" context. */
  latestSalePrice: number | null;
}

type VariantJoin = {
  variant_id: number;
  size_label: string | null;
  exterior_colorway: string | null;
  hardware_color: string | null;
  retail_price_original: number | null;
  currency: string | null;
  style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
};

function brandFrom(style: VariantJoin["style"]): { brandName: string; styleName: string } {
  const s = (Array.isArray(style) ? style[0] : style) ?? null;
  if (!s) return { brandName: "", styleName: "" };
  const brand = Array.isArray(s.brand) ? s.brand[0] : s.brand;
  return { brandName: brand?.name ?? "", styleName: s.name };
}

function baseSaved(v: VariantJoin): SavedBag {
  const { brandName, styleName } = brandFrom(v.style);
  const label = [v.size_label, v.exterior_colorway].filter(Boolean).join(" · ") || "Variant";
  return {
    variantId: v.variant_id,
    brandName,
    styleName,
    label,
    hardwareColor: v.hardware_color,
    retailPrice: v.retail_price_original != null ? Number(v.retail_price_original) : null,
    currency: v.currency,
  };
}

const VARIANT_SELECT =
  "variant_id, size_label, exterior_colorway, hardware_color, retail_price_original, currency, style:style_id(name, brand:brand_id(name))";

/** The current user's closet, newest first. Empty when signed out. */
export async function getCloset(): Promise<ClosetEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("closet_item")
    .select(`status, note, variant:variant_id(${VARIANT_SELECT})`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.flatMap((row) => {
    const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) as VariantJoin | null;
    if (!v) return [];
    return [{ ...baseSaved(v), status: row.status as string, note: row.note as string | null }];
  });
}

export interface PurchaseInfo {
  price: number;
  currency: string | null;
  date: string | null;
}

/**
 * Acquisition price per owned variant for the signed-in user (collection-report
 * cost basis). RESILIENT: if the purchase_* columns don't exist yet (migration
 * 0014 not applied) or the query fails, returns {} so the report just omits the
 * Paid / Gain-loss columns — never breaks.
 */
export async function getPurchaseInfo(): Promise<Record<number, PurchaseInfo>> {
  const user = await getCurrentUser();
  if (!user) return {};
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("closet_item")
      .select("variant_id, purchase_price, purchase_currency, purchase_date");
    if (error || !data) return {};
    const map: Record<number, PurchaseInfo> = {};
    for (const r of data as {
      variant_id: number;
      purchase_price: number | string | null;
      purchase_currency: string | null;
      purchase_date: string | null;
    }[]) {
      if (r.purchase_price != null) {
        map[r.variant_id] = {
          price: Number(r.purchase_price),
          currency: r.purchase_currency,
          date: r.purchase_date,
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}

/** The current user's watchlist, newest first. Empty when signed out. */
export async function getWatchlist(): Promise<WatchlistEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabase();
  const variantJoin = `variant:variant_id(${VARIANT_SELECT}, price_history(sale_price, date_recorded))`;
  // Try the 0033 columns; fall back to the legacy select if the migration is unapplied.
  let { data, error } = await supabase
    .from("watchlist")
    .select(`target_price, currency, alert_enabled, alert_mode, alert_pct, ${variantJoin}`)
    .order("created_at", { ascending: false });

  if (error && (error.code === "42703" || /column .* does not exist/i.test(error.message ?? ""))) {
    const fb = await supabase
      .from("watchlist")
      .select(`target_price, currency, alert_enabled, ${variantJoin}`)
      .order("created_at", { ascending: false });
    data = fb.data as unknown as typeof data;
    error = fb.error;
  }

  if (error || !data) return [];

  return data.flatMap((row) => {
    const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) as
      | (VariantJoin & { price_history: { sale_price: number | null; date_recorded: string }[] | null })
      | null;
    if (!v) return [];
    const prices = (v.price_history ?? [])
      .filter((p) => p.sale_price != null)
      .sort((a, b) => b.date_recorded.localeCompare(a.date_recorded));
    const r = row as typeof row & { alert_mode?: string | null; alert_pct?: number | null };
    return [
      {
        ...baseSaved(v),
        targetPrice: r.target_price != null ? Number(r.target_price) : null,
        alertEnabled: Boolean(r.alert_enabled),
        alertMode: r.alert_mode === "pct_below_median" ? ("pct_below_median" as const) : ("absolute" as const),
        alertPct: r.alert_pct != null ? Number(r.alert_pct) : null,
        latestSalePrice: prices[0]?.sale_price != null ? Number(prices[0].sale_price) : null,
      },
    ];
  });
}

/** Whether the current user has this variant in their closet / watchlist, for toggling buttons. */
export interface VariantUserState {
  signedIn: boolean;
  closetStatus: string | null;
  watching: boolean;
}

export async function getVariantUserState(variantId: number): Promise<VariantUserState> {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, closetStatus: null, watching: false };

  const supabase = await createServerSupabase();
  const [closetRes, watchRes] = await Promise.all([
    supabase.from("closet_item").select("status").eq("variant_id", variantId).maybeSingle(),
    supabase.from("watchlist").select("watch_id").eq("variant_id", variantId).maybeSingle(),
  ]);

  return {
    signedIn: true,
    closetStatus: (closetRes.data?.status as string | undefined) ?? null,
    watching: Boolean(watchRes.data),
  };
}
