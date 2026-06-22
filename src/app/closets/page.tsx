import Link from "next/link";
import { getCovetedClosets, getTopReviewers } from "@/lib/social";
import { TrustBadges } from "@/components/TrustBadges";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboards · The Luxury Catalog",
  description:
    "The most-coveted closets and most-active reviewers on The Luxury Catalog — boards that move as the community contributes.",
};

export default async function LeaderboardsPage() {
  const [closets, reviewers] = await Promise.all([
    getCovetedClosets(50),
    getTopReviewers(25),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Leaderboards</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">
          Who&rsquo;s rising this season
        </h1>
        <p className="mt-2 max-w-prose text-muted">
          These boards reward movement — keep collecting, follow the closets you
          love, and write honest reviews, and you climb. Make your closet public
          in your profile to be eligible.
        </p>
      </header>

      {/* Most Coveted Closets */}
      <section>
        <div className="mb-3">
          <h2 className="font-serif text-2xl text-foreground">Most Coveted Closets</h2>
          <p className="mt-1 max-w-prose text-sm text-muted">
            Ranked by followers and how often their bags land on other
            collectors&rsquo; wishlists. A closet climbs the moment someone
            covets one of its bags.
          </p>
        </div>

        {closets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-10 text-center text-muted">
            No public closets yet. Be the first — make your closet public and start collecting.
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {closets.map((c, i) => {
              const inner = (
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:border-gold">
                  <span className="w-7 shrink-0 font-serif text-lg text-gold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-foreground">
                      {c.displayName || (c.handle ? `@${c.handle}` : "A collector")}
                    </p>
                    <TrustBadges
                      isVerified={c.isVerified}
                      isExpert={c.isExpert}
                      isAuthenticator={c.isAuthenticator}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex shrink-0 gap-4 text-right text-xs text-muted">
                    <span>
                      <span className="block font-serif text-base text-foreground">{c.favoriteCount}</span>
                      followers
                    </span>
                    <span>
                      <span className="block font-serif text-base text-foreground">{c.wantDemand}</span>
                      coveted
                    </span>
                    <span>
                      <span className="block font-serif text-base text-foreground">{c.ownedCount}</span>
                      owned
                    </span>
                  </div>
                </div>
              );
              return (
                <li key={c.userId}>
                  {c.handle ? <Link href={`/u/${c.handle}`}>{inner}</Link> : inner}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Top Reviewers */}
      <section>
        <div className="mb-3">
          <h2 className="font-serif text-2xl text-foreground">Top Reviewers</h2>
          <p className="mt-1 max-w-prose text-sm text-muted">
            The collectors writing the most published reviews. Every honest
            review you add moves you up — and helps the next buyer.
          </p>
        </div>

        {reviewers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-10 text-center text-muted">
            No published reviews yet. Be the first to review a bag you&rsquo;ve carried.
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {reviewers.map((r, i) => {
              const inner = (
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:border-gold">
                  <span className="w-7 shrink-0 font-serif text-lg text-gold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-foreground">
                      {r.displayName || (r.handle ? `@${r.handle}` : "A reviewer")}
                    </p>
                    <TrustBadges
                      isVerified={r.isVerified}
                      isExpert={r.isExpert}
                      isAuthenticator={r.isAuthenticator}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex shrink-0 gap-4 text-right text-xs text-muted">
                    <span>
                      <span className="block font-serif text-base text-foreground">{r.reviewCount}</span>
                      reviews
                    </span>
                    {r.averageRating != null && (
                      <span>
                        <span className="block font-serif text-base text-foreground">{r.averageRating}</span>
                        avg rating
                      </span>
                    )}
                  </div>
                </div>
              );
              return (
                <li key={r.userId}>
                  {r.handle ? <Link href={`/u/${r.handle}`}>{inner}</Link> : inner}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
