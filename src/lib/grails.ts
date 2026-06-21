import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

/**
 * "My Four Grails" reads, built on the 0011 schema. Every query degrades to an
 * empty list when Supabase env or the migration is absent, exactly like the
 * social.ts reads — the cloud build has no DB credentials.
 */

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export const MAX_GRAILS = 4;

export interface Grail {
  position: number;
  variantId: number;
  brandName: string;
  styleName: string;
  label: string;
}

type VariantStyleJoin = {
  variant_id: number;
  size_label: string | null;
  exterior_colorway: string | null;
  style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
};

function variantToGrail(position: number, v: VariantStyleJoin): Grail {
  const s = (Array.isArray(v.style) ? v.style[0] : v.style) ?? null;
  const brand = s ? (Array.isArray(s.brand) ? s.brand[0] : s.brand) : null;
  const label = [v.size_label, v.exterior_colorway].filter(Boolean).join(" · ") || "Variant";
  return {
    position,
    variantId: v.variant_id,
    brandName: brand?.name ?? "",
    styleName: s?.name ?? "",
    label,
  };
}

const GRAIL_SELECT =
  "position, variant:variant_id(variant_id, size_label, exterior_colorway, style:style_id(name, brand:brand_id(name)))";

/**
 * The four grails for a given user, ordered by slot (1..4). Returns up to four.
 * Public RLS (0011 `four_grails_select_public`) only exposes grails of public /
 * notable profiles to anon reads, so this never leaks a private user's picks.
 */
export async function getFourGrails(userId: string): Promise<Grail[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("four_grails")
    .select(GRAIL_SELECT)
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .limit(MAX_GRAILS);

  if (error || !data) return [];

  return (data as { position: number; variant: VariantStyleJoin | VariantStyleJoin[] | null }[]).flatMap(
    (r) => {
      const v = (Array.isArray(r.variant) ? r.variant[0] : r.variant) ?? null;
      return v ? [variantToGrail(r.position, v)] : [];
    }
  );
}

/** The current user's own grails (for the profile-edit picker / owner display). */
export async function getMyGrails(): Promise<Grail[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return getFourGrails(user.id);
}
