import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

/**
 * Activity feed (engagement-strategy §1b/§1c). A read-only stream of STRUCTURED
 * events derived entirely from existing tables — no free text, no moderation.
 *
 * Privacy (0006): only `have` additions of `closet_public` profiles are exposed;
 * want/had stay private. Reviews and published posts are already public. The
 * feed shows events from the closets the current user favorites.
 *
 * Degrades to [] when env / migrations are absent.
 */

export type FeedEventType = "closet_add" | "review" | "post" | "photo_featured";

export interface FeedEvent {
  id: string;
  type: FeedEventType;
  createdAt: string;
  actorUserId: string;
  actorHandle: string | null;
  actorName: string | null;
  /** Bag this event points at, when applicable. */
  variantId: number | null;
  brandName: string | null;
  styleName: string | null;
  /** Type-specific detail: rating for reviews, post title/slug for posts. */
  rating?: number | null;
  postTitle?: string | null;
  postSlug?: string | null;
}

export type Actor = { handle: string | null; name: string | null; closetPublic: boolean };
type ActorMap = Map<string, Actor>;

export function bagFrom(variant: unknown): { variantId: number | null; brandName: string | null; styleName: string | null } {
  const v = (Array.isArray(variant) ? variant[0] : variant) as
    | { variant_id: number; style: unknown }
    | null;
  if (!v) return { variantId: null, brandName: null, styleName: null };
  const s = (Array.isArray(v.style) ? v.style[0] : v.style) as
    | { name: string; brand: { name: string } | { name: string }[] | null }
    | null;
  const brand = s ? (Array.isArray(s.brand) ? s.brand[0] : s.brand) : null;
  return { variantId: v.variant_id, brandName: brand?.name ?? null, styleName: s?.name ?? null };
}

/** The user ids the current user follows. Empty when signed out / no data. */
async function getFollowedIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("closet_favorite")
    .select("owner_user_id")
    .eq("follower_user_id", user.id);
  return (data ?? []).map((r) => r.owner_user_id as string);
}

const VARIANT_SELECT =
  "variant:variant_id(variant_id, style:style_id(name, brand:brand_id(name)))";

/**
 * The activity feed for the current user — recent structured events from closets
 * they follow, newest first. Returns [] when the user follows no one or data is
 * unavailable.
 */
export async function getFeed(limit = 40): Promise<FeedEvent[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const followed = await getFollowedIds();
  if (followed.length === 0) return [];

  const supabase = await createServerSupabase();

  // Resolve actor display info + public flag once.
  const { data: actorRows } = await supabase
    .from("profile")
    .select("id, handle, display_name, closet_public")
    .in("id", followed);
  const actors: ActorMap = new Map(
    (actorRows ?? []).map((p) => [
      p.id as string,
      { handle: (p.handle as string) ?? null, name: (p.display_name as string) ?? null, closetPublic: Boolean(p.closet_public) },
    ])
  );
  const publicIds = followed.filter((id) => actors.get(id)?.closetPublic);

  const events: FeedEvent[] = [];

  // 1. Closet `have` additions — only from public closets (privacy rule).
  if (publicIds.length > 0) {
    const { data } = await supabase
      .from("closet_item")
      .select(`closet_id, user_id, created_at, ${VARIANT_SELECT}`)
      .in("user_id", publicIds)
      .eq("status", "have")
      .order("created_at", { ascending: false })
      .limit(limit);
    for (const r of (data ?? []) as { closet_id: number; user_id: string; created_at: string; variant: unknown }[]) {
      const actor = actors.get(r.user_id);
      const bag = bagFrom(r.variant);
      events.push({
        id: `closet_${r.closet_id}`,
        type: "closet_add",
        createdAt: r.created_at,
        actorUserId: r.user_id,
        actorHandle: actor?.handle ?? null,
        actorName: actor?.name ?? null,
        ...bag,
      });
    }
  }

  // 2. Reviews (already public).
  {
    const { data } = await supabase
      .from("review")
      .select(`review_id, user_id, rating, created_at, ${VARIANT_SELECT}`)
      .in("user_id", followed)
      .order("created_at", { ascending: false })
      .limit(limit);
    for (const r of (data ?? []) as { review_id: number; user_id: string; rating: number; created_at: string; variant: unknown }[]) {
      const actor = actors.get(r.user_id);
      const bag = bagFrom(r.variant);
      events.push({
        id: `review_${r.review_id}`,
        type: "review",
        createdAt: r.created_at,
        actorUserId: r.user_id,
        actorHandle: actor?.handle ?? null,
        actorName: actor?.name ?? null,
        rating: r.rating,
        ...bag,
      });
    }
  }

  // 3. Published expert posts.
  {
    const { data } = await supabase
      .from("post")
      .select("post_id, author_user_id, title, slug, published_at, created_at")
      .in("author_user_id", followed)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    for (const r of (data ?? []) as { post_id: number; author_user_id: string; title: string; slug: string; published_at: string | null; created_at: string }[]) {
      const actor = actors.get(r.author_user_id);
      events.push({
        id: `post_${r.post_id}`,
        type: "post",
        createdAt: r.published_at ?? r.created_at,
        actorUserId: r.author_user_id,
        actorHandle: actor?.handle ?? null,
        actorName: actor?.name ?? null,
        variantId: null,
        brandName: null,
        styleName: null,
        postTitle: r.title,
        postSlug: r.slug,
      });
    }
  }

  return sortFeedEvents(events, limit);
}

/**
 * Merge + order feed events newest-first and cap to `limit`. Pure (no DB) so the
 * ordering is unit-testable. ISO-8601 createdAt strings sort lexically by time.
 */
export function sortFeedEvents(events: FeedEvent[], limit = 40): FeedEvent[] {
  return [...events]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
