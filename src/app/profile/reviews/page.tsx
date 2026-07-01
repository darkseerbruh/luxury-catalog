import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export const metadata = { title: "My reviews · Luxury Catalog" };

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function MyReviewsPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const reviews = await getMyReviews();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Profile</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">My reviews</h1>
        <p className="mt-2 text-muted">
          Every bag you&rsquo;ve reviewed — in your closet or not.
        </p>
      </header>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">You haven&rsquo;t written any reviews yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Tried a bag at a store, borrowed one, or rented it? Share how it wears —
            you don&rsquo;t need to own it.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Find a bag to review
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.reviewId} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/bag/${r.variantId}`} className="min-w-0">
                  <p className="text-sm uppercase tracking-wide text-muted">{r.brandName}</p>
                  <p className="font-serif text-foreground hover:text-gold">{r.styleName}</p>
                  <p className="text-sm text-muted">{r.label}</p>
                </Link>
                <StarRow rating={r.rating} />
              </div>
              {r.title && <p className="mt-3 font-medium text-foreground">{r.title}</p>}
              {r.body && <p className="mt-1 text-sm leading-relaxed text-muted">{r.body}</p>}
              <Link
                href={`/bag/${r.variantId}`}
                className="mt-3 inline-block text-xs text-gold/80 hover:text-gold"
              >
                View / edit on the bag page →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
