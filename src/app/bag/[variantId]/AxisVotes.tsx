import { getAxisVotes } from "@/lib/votes";
import AxisVoteControl from "./AxisVoteControl";

/**
 * "How owners rate it" — Fragrantica-style character bars (UX #18, brief §F).
 * Each fixed axis renders as a proportional bar (average mapped 1..5 → 0..100%)
 * with its average + vote count, plus a per-axis voting control for signed-in
 * members. Honest empty state where an axis has no votes. Dependency-free.
 */
export default async function AxisVotes({ variantId }: { variantId: number }) {
  const summary = await getAxisVotes(variantId);

  return (
    <section id="owner-ratings" className="border-t border-border pt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">How owners rate it</h2>
        {summary.totalVotes > 0 && (
          <p className="text-sm text-muted">
            {summary.totalVotes} {summary.totalVotes === 1 ? "vote" : "votes"} across axes
          </p>
        )}
      </div>

      {!summary.signedIn && (
        <p className="mb-4 text-sm text-muted">
          <a href="/login" className="text-gold hover:underline">
            Log in
          </a>{" "}
          to rate how this bag really wears.
        </p>
      )}

      <ul className="flex flex-col gap-5">
        {summary.axes.map((a) => {
          // Average (1..5) → 0..100% fill. Empty axes show a flat, honest bar.
          const pct = a.average != null ? ((a.average - 1) / 4) * 100 : 0;
          return (
            <li key={a.axis} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium text-foreground">{a.label}</p>
                {a.count > 0 ? (
                  <p className="text-xs text-muted">
                    <span className="text-gold">{a.average?.toFixed(1)}</span> / 5 · {a.count}{" "}
                    {a.count === 1 ? "vote" : "votes"}
                  </p>
                ) : (
                  <p className="text-xs text-muted/70">No votes yet</p>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="w-20 shrink-0 text-right text-[0.7rem] text-muted/70">{a.low}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border/60">
                  {a.average != null && (
                    <div
                      className="h-full rounded-full bg-gold transition-all"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  )}
                </div>
                <span className="w-20 shrink-0 text-[0.7rem] text-muted/70">{a.high}</span>
              </div>

              {summary.signedIn && (
                <AxisVoteControl
                  variantId={variantId}
                  axis={a.axis}
                  low={a.low}
                  high={a.high}
                  initialValue={a.myValue}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
