import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

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
