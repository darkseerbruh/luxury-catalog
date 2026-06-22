/**
 * DB-read layer for the Phase-1 personalization aggregation.
 * Gathers raw signals from Supabase and delegates to aggregation-core.ts.
 * Uses the service-role client so it can read cross-user data for the
 * batch rebuild — individual reads are still user-scoped via the
 * user_profile RLS policy.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { aggregateSignals } from "./aggregation-core";
import type { ClosetSignal, RawUserSignals, WatchlistSignal } from "./types";

type ProfileRow = {
  persona: string | null;
  taste_vector: Record<string, Record<string, number>> | null;
  taste_completeness: number | null;
};

type ClosetRow = {
  status: string;
  created_at: string;
  purchase_price: number | null;
  variant: {
    retail_price_original: number | null;
    hardware_color: string | null;
    size_category: string | null;
    style: {
      silhouette: string | null;
      brand: { name: string } | null;
    } | null;
    exterior_material: { material_type: string | null } | null;
  } | null;
};

type WatchlistRow = {
  variant_id: number;
  target_price: number | null;
  alert_enabled: boolean;
  created_at: string;
  variant: {
    style: { brand: { name: string } | null } | null;
  } | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  return (Array.isArray(v) ? v[0] : v) ?? null;
}

/**
 * Gather all personalization signals for one user from the DB.
 * Uses the service-role client (bypasses RLS) so this is safe to call
 * from the cron job or a server action that has already verified identity.
 * Returns null when the DB isn't configured (no env vars).
 */
export async function gatherUserSignals(userId: string): Promise<RawUserSignals | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const admin = getSupabaseAdmin();

  // ── 1. Profile (persona + taste_vector snapshot) ──────────────────────
  const { data: profileData } = await admin
    .from("profile")
    .select("persona, taste_vector, taste_completeness")
    .eq("id", userId)
    .maybeSingle();

  const profile = profileData as ProfileRow | null;

  // ── 2. Closet items with variant attributes ───────────────────────────
  const { data: closetData } = await admin
    .from("closet_item")
    .select(
      "status, created_at, purchase_price, variant:variant_id(retail_price_original, hardware_color, size_category, style:style_id(silhouette, brand:brand_id(name)), exterior_material:exterior_material_id(material_type))"
    )
    .eq("user_id", userId);

  const closetItems: ClosetSignal[] = ((closetData ?? []) as unknown as ClosetRow[])
    .filter((r) => r.status === "want" || r.status === "have" || r.status === "had")
    .map((r) => {
      const v = one(r.variant);
      const style = v ? one(v.style) : null;
      const brand = style ? one(style.brand) : null;
      const material = v ? one(v.exterior_material) : null;
      return {
        variantId: 0, // not needed for aggregation
        status: r.status as "want" | "have" | "had",
        createdAt: r.created_at,
        purchasePrice: r.purchase_price != null ? Number(r.purchase_price) : null,
        retailPrice: v?.retail_price_original != null ? Number(v.retail_price_original) : null,
        brandName: brand?.name ?? null,
        silhouette: style?.silhouette ?? null,
        sizeCategory: v?.size_category ?? null,
        hardwareColor: v?.hardware_color ?? null,
        materialType: material?.material_type ?? null,
      };
    });

  // ── 3. Watchlist ───────────────────────────────────────────────────────
  const { data: watchData } = await admin
    .from("watchlist")
    .select(
      "variant_id, target_price, alert_enabled, created_at, variant:variant_id(style:style_id(brand:brand_id(name)))"
    )
    .eq("user_id", userId);

  const watchlistItems: WatchlistSignal[] = ((watchData ?? []) as unknown as WatchlistRow[]).map((r) => {
    const v = one(r.variant);
    const style = v ? one(v.style) : null;
    const brand = style ? one(style.brand) : null;
    return {
      variantId: r.variant_id,
      targetPrice: r.target_price != null ? Number(r.target_price) : null,
      alertEnabled: r.alert_enabled,
      createdAt: r.created_at,
      brandName: brand?.name ?? null,
    };
  });

  // ── 4. Review count ────────────────────────────────────────────────────
  const { count: reviewCount } = await admin
    .from("review")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    persona: profile?.persona ?? null,
    tasteVectorSnapshot: (profile?.taste_vector as Record<string, Record<string, number>> | null) ?? null,
    tasteCompleteness: profile?.taste_completeness ?? 0,
    closetItems,
    watchlistItems,
    reviewCount: reviewCount ?? 0,
  };
}

/**
 * Gather signals and compute the aggregated profile for one user.
 * Returns null when the DB isn't configured.
 */
export async function computeUserProfile(userId: string) {
  const signals = await gatherUserSignals(userId);
  if (!signals) return null;
  return aggregateSignals(signals);
}
