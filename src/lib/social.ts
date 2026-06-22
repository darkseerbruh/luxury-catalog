import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import type { SocialLinks } from "./auth";

/**
 * Social layer reads built on the 0006/0007 schema. Every query degrades to
 * empty/null when Supabase env or the migrations are absent, exactly like
 * getResourcesForStyle() — the cloud build has no DB credentials.
 */

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export interface PublicClosetBag {
  variantId: number;
  brandName: string;
  styleName: string;
  label: string;
}

export interface PublicProfile {
  userId: string;
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isExpert: boolean;
  isAuthenticator: boolean;
  socialLinks: SocialLinks;
  closetPublic: boolean;
  /** Public ('have') closet items, curated. Empty if the closet isn't public. */
  closet: PublicClosetBag[];
  ownedCount: number;
  favoriteCount: number;
  reviewCount: number;
}

type VariantStyleJoin = {
  variant_id: number;
  size_label: string | null;
  exterior_colorway: string | null;
  style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
};

function variantToBag(v: VariantStyleJoin): PublicClosetBag {
  const s = (Array.isArray(v.style) ? v.style[0] : v.style) ?? null;
  const brand = s ? (Array.isArray(s.brand) ? s.brand[0] : s.brand) : null;
  const label = [v.size_label, v.exterior_colorway].filter(Boolean).join(" · ") || "Variant";
  return {
    variantId: v.variant_id,
    brandName: brand?.name ?? "",
    styleName: s?.name ?? "",
    label,
  };
}

/**
 * A public profile for /u/[handle]. Returns null when the handle doesn't exist
 * or the profile isn't world-readable (the 0006 RLS `profile_select_public`
 * policy only exposes opted-in / notable accounts, so a private profile simply
 * isn't returned by the anon-keyed read).
 */
export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  if (!hasSupabase()) return null;
  const clean = handle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(clean)) return null;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profile")
    .select(
      "id, handle, display_name, bio, avatar_url, closet_public, is_verified, is_expert, is_authenticator, social_links"
    )
    .eq("handle", clean)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    id: string; handle: string; display_name: string | null; bio: string | null;
    avatar_url: string | null; closet_public: boolean | null; is_verified: boolean | null;
    is_expert: boolean | null; is_authenticator: boolean | null; social_links: Record<string, unknown> | null;
  };

  let closet: PublicClosetBag[] = [];
  if (row.closet_public) {
    const { data: items } = await supabase
      .from("closet_item")
      .select(
        "variant:variant_id(variant_id, size_label, exterior_colorway, style:style_id(name, brand:brand_id(name)))"
      )
      .eq("user_id", row.id)
      .eq("status", "have")
      .order("created_at", { ascending: false })
      .limit(60);
    closet = ((items ?? []) as { variant: VariantStyleJoin | VariantStyleJoin[] | null }[]).flatMap((r) => {
      const v = (Array.isArray(r.variant) ? r.variant[0] : r.variant) ?? null;
      return v ? [variantToBag(v)] : [];
    });
  }

  const [{ count: favCount }, { count: reviewCount }] = await Promise.all([
    supabase.from("closet_favorite").select("closet_favorite_id", { count: "exact", head: true }).eq("owner_user_id", row.id),
    supabase.from("review").select("review_id", { count: "exact", head: true }).eq("user_id", row.id),
  ]);

  return {
    userId: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    isVerified: Boolean(row.is_verified),
    isExpert: Boolean(row.is_expert),
    isAuthenticator: Boolean(row.is_authenticator),
    socialLinks: (row.social_links as SocialLinks) ?? {},
    closetPublic: Boolean(row.closet_public),
    closet,
    ownedCount: closet.length,
    favoriteCount: favCount ?? 0,
    reviewCount: reviewCount ?? 0,
  };
}

export interface CovetedCloset {
  userId: string;
  handle: string | null;
  displayName: string | null;
  isVerified: boolean;
  isExpert: boolean;
  isAuthenticator: boolean;
  ownedCount: number;
  wantDemand: number;
  favoriteCount: number;
  /** Composite coveted score: favorites + want-demand, owned as a tiebreaker. */
  score: number;
}

/**
 * The "Most Coveted Closets" leaderboard, from the closet_stats view (0006).
 * Ranked by a composite of favorites + want-demand. Empty when the view is
 * absent (migration not applied) or there are no public closets.
 */
export async function getCovetedClosets(limit = 50): Promise<CovetedCloset[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("closet_stats")
    .select(
      "user_id, handle, display_name, is_verified, is_expert, is_authenticator, owned_count, want_demand, favorite_count"
    )
    .limit(500);

  if (error || !data) return [];

  return (data as {
    user_id: string; handle: string | null; display_name: string | null;
    is_verified: boolean | null; is_expert: boolean | null; is_authenticator: boolean | null;
    owned_count: number | null; want_demand: number | null; favorite_count: number | null;
  }[])
    .map((r) => {
      const ownedCount = r.owned_count ?? 0;
      const wantDemand = r.want_demand ?? 0;
      const favoriteCount = r.favorite_count ?? 0;
      return {
        userId: r.user_id,
        handle: r.handle,
        displayName: r.display_name,
        isVerified: Boolean(r.is_verified),
        isExpert: Boolean(r.is_expert),
        isAuthenticator: Boolean(r.is_authenticator),
        ownedCount,
        wantDemand,
        favoriteCount,
        score: favoriteCount * 2 + wantDemand + ownedCount * 0.1,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface TopReviewer {
  userId: string;
  handle: string | null;
  displayName: string | null;
  isVerified: boolean;
  isExpert: boolean;
  isAuthenticator: boolean;
  reviewCount: number;
  /** Average star rating across this reviewer's published reviews (1 dp), or null. */
  averageRating: number | null;
}

/**
 * The "Top Reviewers" leaderboard — published review count per user, ranked.
 * Reads the `review` table joined to public-readable `profile` rows (same RLS
 * surface getPublicProfile relies on), then aggregates in JS exactly like
 * getCovetedClosets composes its score client-side. Only profiles that are
 * world-readable (opted-in / notable) surface, so a private reviewer never
 * appears. Empty when env/migrations are absent or no public reviews exist.
 *
 * TODO(migration): contribution XP/points — a real points economy (XP-for-value,
 * resettable seasons) needs new tables (e.g. contribution_event / xp_ledger).
 * This board ranks on existing review rows only and invents no score.
 */
export async function getTopReviewers(limit = 25): Promise<TopReviewer[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("review")
    .select(
      "user_id, rating, author:user_id(id, handle, display_name, closet_public, is_verified, is_expert, is_authenticator)"
    )
    .limit(2000);

  if (error || !data) return [];

  type Row = {
    user_id: string;
    rating: number | null;
    author:
      | {
          id: string; handle: string | null; display_name: string | null;
          closet_public: boolean | null; is_verified: boolean | null;
          is_expert: boolean | null; is_authenticator: boolean | null;
        }
      | {
          id: string; handle: string | null; display_name: string | null;
          closet_public: boolean | null; is_verified: boolean | null;
          is_expert: boolean | null; is_authenticator: boolean | null;
        }[]
      | null;
  };

  const byUser = new Map<string, { reviewer: TopReviewer; ratingSum: number; rated: number }>();
  for (const row of data as Row[]) {
    const a = (Array.isArray(row.author) ? row.author[0] : row.author) ?? null;
    // Only world-readable profiles come back from the anon-keyed join; skip rows
    // whose author the RLS policy didn't expose.
    if (!a) continue;
    const existing = byUser.get(row.user_id);
    const rating = row.rating ?? null;
    if (existing) {
      existing.reviewer.reviewCount += 1;
      if (rating != null) { existing.ratingSum += rating; existing.rated += 1; }
    } else {
      byUser.set(row.user_id, {
        reviewer: {
          userId: row.user_id,
          handle: a.handle,
          displayName: a.display_name,
          isVerified: Boolean(a.is_verified),
          isExpert: Boolean(a.is_expert),
          isAuthenticator: Boolean(a.is_authenticator),
          reviewCount: 1,
          averageRating: null,
        },
        ratingSum: rating != null ? rating : 0,
        rated: rating != null ? 1 : 0,
      });
    }
  }

  return [...byUser.values()]
    .map(({ reviewer, ratingSum, rated }) => ({
      ...reviewer,
      averageRating: rated > 0 ? Math.round((ratingSum / rated) * 10) / 10 : null,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

/** Whether the current user is following (favoriting) the given closet owner. */
export async function isFavoritingCloset(ownerUserId: string): Promise<boolean> {
  if (!hasSupabase()) return false;
  const user = await getCurrentUser();
  if (!user || user.id === ownerUserId) return false;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("closet_favorite")
    .select("closet_favorite_id")
    .eq("follower_user_id", user.id)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * The set of user ids who own ('have'/'had') a given variant — used to stamp a
 * "verified owner" badge on their reviews. Reads only the catalogued closet
 * graph; empty when env/migrations are absent.
 */
export async function getVerifiedOwnerIds(variantId: number): Promise<Set<string>> {
  if (!hasSupabase()) return new Set();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("closet_item")
    .select("user_id, status")
    .eq("variant_id", variantId)
    .in("status", ["have", "had"]);
  if (error || !data) return new Set();
  return new Set((data as { user_id: string }[]).map((r) => r.user_id));
}

/** Whether the current user owns (have/had) the variant — verified-owner self-check. */
export async function currentUserOwns(variantId: number): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (!hasSupabase()) return false;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("closet_item")
    .select("status")
    .eq("variant_id", variantId)
    .in("status", ["have", "had"])
    .maybeSingle();
  return Boolean(data);
}
