import Link from "next/link";
import { getReviewLeaderboards, type LeaderboardEntry } from "@/lib/leaderboards";

/**
 * "What the community knows" — homepage section powered by real review data
 * (docs/ux/review-data-leaderboards.md). Two jobs: surface review-driven
 * leaderboards (only the boards that have enough ratings render), and drive
 * contributions (the flywheel: more ratings sharpen the boards + recs, and the
 * add-a-photo prompt feeds the licensed-image base layer). Not directly
 * monetizable; it is the engagement loop under the things that are.
 *
 * Fully resilient: with no review data yet, the boards are simply omitted and the
 * contribution driver still invites the first ratings. Nothing is fabricated.
 */

function Board({ title, note, entries }: { title: string; note: string; entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-serif text-lg text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs text-muted">{note}</p>
      <ol className="mt-3 flex flex-col gap-2">
        {entries.map((e, i) => (
          <li key={e.variantId}>
            <Link
              href={`/bag/${e.variantId}`}
              className="flex items-baseline gap-2 text-sm transition-colors hover:text-gold"
            >
              <span className="w-4 flex-shrink-0 text-gold">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">
                {e.brandName} {e.styleName}
              </span>
              <span className="flex-shrink-0 text-gold">{e.value}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function CommunityLeaderboards() {
  const boards = await getReviewLeaderboards();
  const hasAny =
    boards.mostDurable.length > 0 ||
    boards.highestRated.length > 0 ||
    boards.mostWorthIt.length > 0 ||
    boards.byOccasion.length > 0;

  return (
    <section className="border-b border-border px-5 py-12">
      <p className="text-sm uppercase tracking-widest text-gold">Powered by real owners</p>
      <h2 className="mt-1 font-serif text-2xl text-foreground">What the community knows</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Leaderboards built from real reviews. Rate a bag you have carried and you
        sharpen the boards, your recommendations, and the photos everyone sees.
      </p>

      {hasAny && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Board title="Most durable" note="from durability ratings" entries={boards.mostDurable} />
          <Board title="Highest rated" note="from overall ratings" entries={boards.highestRated} />
          <Board title="Most worth it" note="from worth-it votes" entries={boards.mostWorthIt} />
          {boards.byOccasion.map((b) => (
            <Board key={b.occasion} title={b.title} note="rated by owners who carried it there" entries={b.entries} />
          ))}
        </div>
      )}

      {/* Contribution driver — always shown, the point of the section. */}
      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-gold/40 bg-gold/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-xl text-foreground">
            Carried one? Rate it in 10 seconds.
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Tap a few ratings, say whether it was worth it, add a photo. Every review
            climbs the contributor tiers and makes the boards smarter.
          </p>
        </div>
        <Link
          href="/search"
          className="inline-block flex-shrink-0 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Find a bag to rate &rarr;
        </Link>
      </div>
    </section>
  );
}
