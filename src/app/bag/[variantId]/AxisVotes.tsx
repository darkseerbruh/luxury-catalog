import { getAxisVotes, type AxisAggregate } from "@/lib/votes";
import AxisVoteControl from "./AxisVoteControl";

/**
 * "What owners say" — the per-bag opinion axes (0063 vocabulary).
 *
 * Two groups, two visual treatments, because they are two different kinds of
 * question (full reasoning in src/lib/axes.ts):
 *
 *   DESCRIBE (polar)  neither end is better, so it renders as a MARKER on a
 *                     track. A fill-from-left bar would imply "more is better"
 *                     and quietly turn "slouchy" into a low score.
 *   RATE (unipolar)   one end is better, so a proportional fill bar is honest.
 *
 * Describe comes first: the polar taps have no wrong answer, which is the lower
 * posting floor that gets a first contribution out of someone.
 *
 * Honest empty state throughout. Dependency-free.
 */
export default async function AxisVotes({ variantId }: { variantId: number }) {
  const summary = await getAxisVotes(variantId);
  const describe = summary.axes.filter((a) => a.kind === "describe");
  const rate = summary.axes.filter((a) => a.kind === "rate");

  return (
    <section id="owner-ratings" className="border-t border-border pt-8">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">What owners say</h2>
        {summary.totalVotes > 0 && (
          <p className="text-sm text-muted">
            {summary.totalVotes} {summary.totalVotes === 1 ? "read" : "reads"} from owners
          </p>
        )}
      </div>
      <p className="mb-6 text-sm text-muted">
        Lived experience from people who have carried it, not a verdict.
      </p>

      {!summary.signedIn && (
        <p className="mb-6 text-sm text-muted">
          <a href="/login" className="text-gold hover:underline">
            Log in
          </a>{" "}
          to add how this one really wears.
        </p>
      )}

      {/* ---- Describe it: polar, no wrong answer ---- */}
      <h3 className="mb-1 text-sm font-medium text-foreground">What kind of bag it is</h3>
      <p className="mb-4 text-xs text-muted">Neither end is better. It is what it is.</p>
      <ul className="mb-8 flex flex-col gap-4">
        {describe.map((a) => (
          <AxisRow key={a.axis} a={a} variantId={variantId} signedIn={summary.signedIn} />
        ))}
      </ul>

      {/* ---- Rate it: unipolar judgements ---- */}
      <h3 className="mb-1 text-sm font-medium text-foreground">How well it holds up</h3>
      <p className="mb-4 text-xs text-muted">Here, higher is better.</p>
      <ul className="flex flex-col gap-4">
        {rate.map((a) => (
          <AxisRow key={a.axis} a={a} variantId={variantId} signedIn={summary.signedIn} />
        ))}
      </ul>
    </section>
  );
}

function AxisRow({
  a,
  variantId,
  signedIn,
}: {
  a: AxisAggregate;
  variantId: number;
  signedIn: boolean;
}) {
  // Average (1..5) → 0..100% along the track.
  const pct = a.average != null ? ((a.average - 1) / 4) * 100 : 0;
  const isPolar = a.kind === "describe";

  return (
    <li className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-foreground">{a.label}</p>
        {a.count > 0 ? (
          <p className="text-xs text-muted">
            {a.count} {a.count === 1 ? "read" : "reads"}
            {!isPolar && a.average != null && (
              <>
                {" · "}
                <span className="text-gold">{a.average.toFixed(1)}</span> / 5
              </>
            )}
          </p>
        ) : (
          <p className="text-xs text-muted/70">Nobody has weighed in</p>
        )}
      </div>

      <p className="mt-0.5 text-xs text-muted/80">{a.hint}</p>

      <div className="mt-3 flex items-center gap-2">
        <span className="w-24 shrink-0 text-right text-[0.7rem] text-muted/70">{a.low}</span>

        {isPolar ? (
          // Polar: a marker sitting where owners place it. No fill, because a
          // fill would read as a score.
          <div className="relative h-2.5 flex-1 rounded-full bg-border/60">
            <span className="absolute left-1/2 top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
            {a.average != null && (
              <span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-gold transition-all"
                style={{ left: `${pct}%` }}
              />
            )}
          </div>
        ) : (
          // Unipolar: proportional fill, where more genuinely is better.
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border/60">
            {a.average != null && (
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            )}
          </div>
        )}

        <span className="w-24 shrink-0 text-[0.7rem] text-muted/70">{a.high}</span>
      </div>

      {signedIn && (
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
}
