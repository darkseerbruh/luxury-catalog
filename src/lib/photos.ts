import { createServerSupabase } from "./supabase/server";
import { getSupabaseAdmin } from "./supabase/admin";
import { deriveTier, type Tier } from "./contributions-core";

/**
 * Reads for the user-photo system. Everything degrades to empty on a missing
 * env / unapplied 0016 migration (the gallery just shows the rare-find empty
 * state), so nothing breaks pre-migration.
 */

const BUCKET = "bag-photos";

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}
function hasServiceRole(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export interface BagPhoto {
  photoId: number;
  variantId: number;
  url: string;
  caption: string | null;
  featured: boolean;
  /** Uploader byline — handle preferred, else a generic credit. */
  byline: string;
  handle: string | null;
}

type PhotoRow = {
  photo_id: number;
  variant_id: number;
  storage_path: string;
  caption: string | null;
  status: "pending" | "approved" | "featured" | "rejected";
  user_id: string;
  created_at?: string;
  profile?: { handle?: string | null; display_name?: string | null } | { handle?: string | null; display_name?: string | null }[] | null;
};

function bylineOf(row: PhotoRow): { byline: string; handle: string | null } {
  const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
  const handle = p?.handle ?? null;
  const name = handle ? `@${handle}` : p?.display_name ?? "A collector";
  return { byline: name, handle };
}

/** Published (approved + featured) photos for a variant, featured first. */
export async function getApprovedPhotos(variantId: number): Promise<BagPhoto[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("bag_photo")
    .select("photo_id, variant_id, storage_path, caption, status, user_id, profile:user_id(handle, display_name)")
    .eq("variant_id", variantId)
    .in("status", ["approved", "featured"])
    .order("status", { ascending: false }) // 'featured' > 'approved' alphabetically? no — handled below
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const rows = data as unknown as PhotoRow[];
  return rows
    .map((r) => {
      const { byline, handle } = bylineOf(r);
      return {
        photoId: r.photo_id,
        variantId: r.variant_id,
        url: supabase.storage.from(BUCKET).getPublicUrl(r.storage_path).data.publicUrl,
        caption: r.caption,
        featured: r.status === "featured",
        byline,
        handle,
      };
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

export interface PendingPhoto extends BagPhoto {
  brandName: string | null;
  styleName: string | null;
  createdAt: string | null;
}

/** Admin queue: photos awaiting review (or any status). Uses the admin client so
 * the queue works even before the operator sets their own is_admin flag. */
export async function getPhotosForReview(
  status: "pending" | "approved" | "featured" | "rejected" = "pending",
  limit = 200,
): Promise<PendingPhoto[]> {
  if (!hasServiceRole()) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bag_photo")
    .select(
      "photo_id, variant_id, storage_path, caption, status, user_id, created_at, " +
        "profile:user_id(handle, display_name), " +
        "variant:variant_id(style:style_id(name, brand:brand_id(name)))",
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return (data as unknown as (PhotoRow & { variant?: unknown })[]).map((r) => {
    const { byline, handle } = bylineOf(r);
    const v = Array.isArray(r.variant) ? r.variant[0] : r.variant;
    const s = (v as { style?: unknown } | null)?.style;
    const so = (Array.isArray(s) ? s[0] : s) as { name?: string | null; brand?: unknown } | null;
    const brand = so?.brand;
    const bo = (Array.isArray(brand) ? brand[0] : brand) as { name?: string | null } | null;
    return {
      photoId: r.photo_id,
      variantId: r.variant_id,
      url: supabase.storage.from(BUCKET).getPublicUrl(r.storage_path).data.publicUrl,
      caption: r.caption,
      featured: r.status === "featured",
      byline,
      handle,
      brandName: bo?.name ?? null,
      styleName: so?.name ?? null,
      createdAt: r.created_at ?? null,
    };
  });
}

export interface ContributorState {
  points: number;
  approvedPhotos: number;
  pendingPhotos: number;
  tier: Tier;
}

/** A user's contribution rollup + derived tier, for their profile. Resilient. */
export async function getContributorState(userId: string): Promise<ContributorState> {
  const empty: ContributorState = { points: 0, approvedPhotos: 0, pendingPhotos: 0, tier: "aficionado" };
  if (!hasSupabase()) return empty;
  const supabase = await createServerSupabase();

  const [{ data: prof }, photos, closet] = await Promise.all([
    supabase.from("profile").select("contribution_points, is_authenticator, is_admin").eq("id", userId).maybeSingle(),
    supabase.from("bag_photo").select("status").eq("user_id", userId),
    supabase.from("closet_item").select("variant_id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const points = (prof as { contribution_points?: number } | null)?.contribution_points ?? 0;
  const isAuthenticator = Boolean((prof as { is_authenticator?: boolean } | null)?.is_authenticator);
  const isAdmin = Boolean((prof as { is_admin?: boolean } | null)?.is_admin);
  const rows = (photos.data as { status: string }[] | null) ?? [];
  const approvedPhotos = rows.filter((r) => r.status === "approved" || r.status === "featured").length;
  const pendingPhotos = rows.filter((r) => r.status === "pending").length;
  const hasCloset = (closet.count ?? 0) > 0;

  return {
    points,
    approvedPhotos,
    pendingPhotos,
    tier: deriveTier({ hasCloset, approvedPhotos, points, isAuthenticator, isAdmin }),
  };
}

export interface MostWanted {
  variantId: number;
  brandName: string | null;
  styleName: string | null;
  demand: number;
}

/**
 * "Most Wanted Photos": bags people want (closet want/have) that have no photo
 * yet — the high-interest gaps to recruit contributions against. Demand is a
 * cross-user aggregate, so it needs the service-role client; without it the board
 * shows its empty state rather than a misleading list.
 */
export async function getMostWantedPhotos(limit = 24): Promise<MostWanted[]> {
  if (!hasServiceRole()) return [];
  const supabase = getSupabaseAdmin();

  // Variants that already have a hero image or an approved photo are covered.
  const [{ data: photoed }, { data: imaged }, { data: demandRows }] = await Promise.all([
    supabase.from("bag_photo").select("variant_id").in("status", ["approved", "featured"]),
    supabase.from("variant").select("variant_id").not("image_url", "is", null),
    supabase.from("closet_item").select("variant_id"),
  ]);

  const covered = new Set<number>([
    ...((photoed as { variant_id: number }[] | null) ?? []).map((r) => r.variant_id),
    ...((imaged as { variant_id: number }[] | null) ?? []).map((r) => r.variant_id),
  ]);

  const demand = new Map<number, number>();
  for (const r of ((demandRows as { variant_id: number }[] | null) ?? [])) {
    if (covered.has(r.variant_id)) continue;
    demand.set(r.variant_id, (demand.get(r.variant_id) ?? 0) + 1);
  }

  const top = [...demand.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (top.length === 0) return [];

  const ids = top.map(([id]) => id);
  const { data: variants } = await supabase
    .from("variant")
    .select("variant_id, style:style_id(name, brand:brand_id(name))")
    .in("variant_id", ids);

  const byId = new Map<number, { brandName: string | null; styleName: string | null }>();
  for (const v of ((variants as unknown as { variant_id: number; style?: unknown }[] | null) ?? [])) {
    const s = (Array.isArray(v.style) ? v.style[0] : v.style) as { name?: string | null; brand?: unknown } | null;
    const brand = s?.brand;
    const bo = (Array.isArray(brand) ? brand[0] : brand) as { name?: string | null } | null;
    byId.set(v.variant_id, { brandName: bo?.name ?? null, styleName: s?.name ?? null });
  }

  return top.map(([variantId, d]) => ({
    variantId,
    demand: d,
    brandName: byId.get(variantId)?.brandName ?? null,
    styleName: byId.get(variantId)?.styleName ?? null,
  }));
}
