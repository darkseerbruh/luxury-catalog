import { getReviews } from "@/lib/reviews";
import { getCurrentUser } from "@/lib/auth";
import ReviewForm from "./ReviewForm";

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Reviews section: aggregate rating, the write/edit form, and the review list. */
export default async function Reviews({ variantId }: { variantId: number }) {
  const [summary, user] = await Promise.all([getReviews(variantId), getCurrentUser()]);

  // Show the user's own review first, then the rest.
  const others = summary.reviews.filter((r) => !r.isMine);

  return (
    <section className="border-t border-border pt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">Reviews</h2>
        {summary.count > 0 && summary.average != null && (
          <p className="text-sm text-muted">
            <span className="text-lg text-gold">{summary.average.toFixed(1)}</span> / 5 ·{" "}
            {summary.count} {summary.count === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>

      <div className="mb-6">
        <ReviewForm variantId={variantId} signedIn={!!user} existing={summary.myReview} />
      </div>

      {summary.count === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface/50 px-5 py-6 text-center text-sm text-muted">
          No reviews yet. Be the first to share how this bag wears.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {summary.myReview && <ReviewCard review={summary.myReview} />}
          {others.map((r) => (
            <ReviewCard key={r.reviewId} review={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: import("@/lib/reviews").ReviewItem }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <StarRow rating={review.rating} />
        <span className="text-xs text-muted/70">
          {review.isMine ? "You · " : "Member · "}
          {formatDate(review.createdAt)}
        </span>
      </div>
      {review.title && <p className="mt-2 font-medium text-foreground">{review.title}</p>}
      {review.body && <p className="mt-1 text-sm leading-relaxed text-muted">{review.body}</p>}
      {(review.worthIt != null || review.occasion) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {review.worthIt != null && (
            <span className="rounded-full border border-border px-2 py-0.5 text-muted">
              Worth it: {review.worthIt ? "Yes" : "No"}
            </span>
          )}
          {review.occasion && (
            <span className="rounded-full border border-border px-2 py-0.5 text-muted">
              {review.occasion}
            </span>
          )}
        </div>
      )}
    </li>
  );
}
