import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * "Most Wanted Bags" leaderboard data — a GLOBAL ranking of individual bag
 * variants by how many people have them on their want list (closet_item.status
 * = 'want', the want/have/had model from migration 0005). This is distinct from
 * the "Most Coveted Closets" board in social.ts, which ranks people's whole
 * collections; here we rank the bags themselves.
 *
 * closet_item is RLS-owned (the 0002 `closet_all_own` policy only exposes a
 * user's own rows to the anon key), so we aggregate with the service-role admin
 * client and expose ONLY counts, never who wants what — same privacy stance as
 * getVariantDemand() in demand.ts. Server-only.
 *
 * Resilient by design: with no Supabase env (the cloud build has no DB creds),
 * a missing service-role key, an unapplied migration, or a renamed column, every
 * path catches and returns [] rather than throwing, exactly like demand.ts.
 */

export interface MostWantedBag {
  variantId: number;
  brandName: string;
  styleName: string;
  sizeLabel: string | null;
  /** size_label · exterior_colorway, for a one-line variant descriptor. */
  label: string;
  /** How many distinct users have this variant on their want list. */
  wantCount: number;
}

type VariantStyleJoin = {
  variant_id: number;
  size_label: string | null;
  exterior_colorway: string | null;
  style:
    | { name: string; brand: { name: string } | { name: string }[] | null }
    | { name: string; brand: { name: string } | { name: string }[] | null }[]
    | null;
};

type WantRow = {
  variant_id: number;
  variant: VariantStyleJoin | VariantStyleJoin[] | null;
};

function resolveVariant(v: VariantStyleJoin): {
  brandName: string;
  styleName: string;
  sizeLabel: string | null;
  label: string;
} {
  const s = (Array.isArray(v.style) ? v.style[0] : v.style) ?? null;
  const brand = s ? (Array.isArray(s.brand) ? s.brand[0] : s.brand) : null;
  const label =
    [v.size_label, v.exterior_colorway].filter(Boolean).join(" · ") || "Variant";
  return {
    brandName: brand?.name ?? "",
    styleName: s?.name ?? "",
    sizeLabel: v.size_label ?? null,
    label,
  };
}

/**
 * Rank bag variants by want-count, descending. Returns at most `limit` bags,
 * highest demand first; bags with no want signal don't appear. Empty array when
 * the DB is unreachable or the data isn't there yet.
 */
export async function getMostWantedBags(limit = 50): Promise<MostWantedBag[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("closet_item")
      .select(
        "variant_id, variant:variant_id(variant_id, size_label, exterior_colorway, style:style_id(name, brand:brand_id(name)))"
      )
      .eq("status", "want")
      .limit(5000);

    if (error || !data) return [];

    // Count distinct users per variant. The unique (user_id, variant_id)
    // constraint means one 'want' row per user per variant, so a row count per
    // variant is already a distinct-user count.
    const byVariant = new Map<number, MostWantedBag>();
    for (const row of data as WantRow[]) {
      const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) ?? null;
      if (!v) continue;
      const existing = byVariant.get(row.variant_id);
      if (existing) {
        existing.wantCount += 1;
      } else {
        const resolved = resolveVariant(v);
        byVariant.set(row.variant_id, {
          variantId: row.variant_id,
          brandName: resolved.brandName,
          styleName: resolved.styleName,
          sizeLabel: resolved.sizeLabel,
          label: resolved.label,
          wantCount: 1,
        });
      }
    }

    return [...byVariant.values()]
      .sort((a, b) => b.wantCount - a.wantCount)
      .slice(0, Math.max(0, limit));
  } catch {
    return []; // degrade gracefully — the leaderboard is a nice-to-have
  }
}
