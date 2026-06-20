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

/** The current user's watchlist, newest first. Empty when signed out. */
export async function getWatchlist(): Promise<WatchlistEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("watchlist")
    .select(`target_price, currency, alert_enabled, variant:variant_id(${VARIANT_SELECT}, price_history(sale_price, date_recorded))`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.flatMap((row) => {
    const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) as
      | (VariantJoin & { price_history: { sale_price: number | null; date_recorded: string }[] | null })
      | null;
    if (!v) return [];
    const prices = (v.price_history ?? [])
      .filter((p) => p.sale_price != null)
      .sort((a, b) => b.date_recorded.localeCompare(a.date_recorded));
    return [
      {
        ...baseSaved(v),
        targetPrice: row.target_price != null ? Number(row.target_price) : null,
        alertEnabled: Boolean(row.alert_enabled),
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
