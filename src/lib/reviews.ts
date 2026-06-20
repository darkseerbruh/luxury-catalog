import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { getVerifiedOwnerIds } from "./social";

export interface MyReview {
  reviewId: number;
  variantId: number;
  brandName: string;
  styleName: string;
  label: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
}

/** The current user's own reviews across all bags, newest first — for /profile/reviews. */
export async function getMyReviews(): Promise<MyReview[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("review")
    .select(
      "review_id, rating, title, body, created_at, variant:variant_id(variant_id, size_label, exterior_colorway, style:style_id(name, brand:brand_id(name)))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return data.flatMap((r) => {
    const v = (Array.isArray(r.variant) ? r.variant[0] : r.variant) as
      | {
          variant_id: number;
          size_label: string | null;
          exterior_colorway: string | null;
          style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
        }
      | null;
    if (!v) return [];
    const s = (Array.isArray(v.style) ? v.style[0] : v.style) ?? null;
    const brand = s ? (Array.isArray(s.brand) ? s.brand[0] : s.brand) : null;
    const label = [v.size_label, v.exterior_colorway].filter(Boolean).join(" · ") || "Variant";
    return [
      {
        reviewId: r.review_id,
        variantId: v.variant_id,
        brandName: brand?.name ?? "",
        styleName: s?.name ?? "",
        label,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: r.created_at,
      },
    ];
  });
}

export interface ReviewItem {
  reviewId: number;
  rating: number;
  title: string | null;
  body: string | null;
  worthIt: boolean | null;
  occasion: string | null;
  durabilityRating: number | null;
  createdAt: string;
  isMine: boolean;
  /** Reviewer has/had this exact bag in their closet — a "verified owner". */
  verifiedOwner: boolean;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  reviews: ReviewItem[];
  /** The current user's own review, if they've written one. */
  myReview: ReviewItem | null;
}

const EMPTY: ReviewSummary = { average: null, count: 0, reviews: [], myReview: null };

/** Reviews for a variant plus aggregate rating. Public read; flags the viewer's own. */
export async function getReviews(variantId: number): Promise<ReviewSummary> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return EMPTY;

  const [user, supabase] = await Promise.all([getCurrentUser(), createServerSupabase()]);

  const { data, error, count } = await supabase
    .from("review")
    .select(
      "review_id, user_id, rating, title, body, worth_it, occasion, durability_rating, created_at",
      { count: "exact" }
    )
    .eq("variant_id", variantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return EMPTY;

  const rows = data as {
    review_id: number; user_id: string; rating: number; title: string | null;
    body: string | null; worth_it: boolean | null; occasion: string | null;
    durability_rating: number | null; created_at: string;
  }[];

  // Verified-owner derivation: which reviewers have/had this exact bag in their
  // closet. Reads only the catalogued closet graph; RLS limits visibility to
  // public closets + the viewer's own, so this never leaks private ownership.
  const ownerIds = await getVerifiedOwnerIds(variantId);

  const reviews: ReviewItem[] = rows.map((r) => ({
    reviewId: r.review_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    worthIt: r.worth_it,
    occasion: r.occasion,
    durabilityRating: r.durability_rating,
    createdAt: r.created_at,
    isMine: !!user && r.user_id === user.id,
    verifiedOwner: ownerIds.has(r.user_id),
  }));

  const average = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  return {
    average,
    count: count ?? reviews.length,
    reviews,
    myReview: reviews.find((r) => r.isMine) ?? null,
  };
}
