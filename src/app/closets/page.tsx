import Link from "next/link";
import { getCovetedClosets } from "@/lib/social";
import { TrustBadges } from "@/components/TrustBadges";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Most Coveted Closets · The Luxury Catalog",
  description: "The most-followed handbag closets on The Luxury Catalog, and the bags everyone else wants.",
};

export default async function CovetedClosetsPage() {
  const closets = await getCovetedClosets(50);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Leaderboard</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Most Coveted Closets</h1>
        <p className="mt-2 max-w-prose text-muted">
          Ranked by followers and how often their bags turn up on other collectors&rsquo;
          wishlists. Make your closet public in your profile to land on the board.
        </p>
      </header>

      {closets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-10 text-center text-muted">
          No public closets yet. Be the first — make yours public and start the board.
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
    </main>
  );
}
