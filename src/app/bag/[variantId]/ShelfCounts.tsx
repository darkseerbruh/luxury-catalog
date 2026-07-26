import type { ShelfCounts } from "@/lib/demand";

/**
 * "Where this bag sits" — how many people want, have, and had it.
 *
 * Shown to EVERYONE (docs/ux/bag-page-build-plan.md principle 3: one layout, gate
 * only the action). Fragrantica hides its equivalent from logged-out visitors, which
 * spends its best social proof on the people who need it least. A visitor weighing a
 * bag is exactly who "312 people own this" should reach.
 *
 * Honest by contract:
 *  - Renders nothing at all below a floor, because "1 person wants this" is negative
 *    social proof, not proof (NN/g: weak counts read worse than none).
 *  - Bars are proportional to the largest count, so a small shelf never fakes scale.
 *  - The coveted line only appears when there is a real gap to report.
 */

/** Below this, the section is omitted entirely rather than shown thin. */
const MIN_TOTAL = 5;

export default function ShelfCountsPanel({ counts }: { counts: ShelfCounts }) {
  if (counts.total < MIN_TOTAL) return null;

  const max = Math.max(counts.want, counts.have, counts.had, 1);
  const rows = [
    { key: "have", label: "have it", n: counts.have, tone: "bg-gold" },
    { key: "want", label: "want it", n: counts.want, tone: "bg-gold/60" },
    { key: "had", label: "had it", n: counts.had, tone: "bg-muted/50" },
  ].filter((r) => r.n > 0);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-serif text-lg text-foreground">Where this one sits</h2>
      <p className="mt-0.5 text-xs text-muted">Across everyone keeping a closet here.</p>

      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-right text-sm tabular-nums text-foreground">
              {r.n.toLocaleString()}
            </span>
            <span className="w-16 shrink-0 text-xs text-muted">{r.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
              <span
                className={`block h-full rounded-full ${r.tone}`}
                style={{ width: `${Math.max((r.n / max) * 100, 3)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>

      {counts.covetRatio != null && counts.covetRatio >= 2 && counts.want >= 5 && (
        <p className="mt-4 text-sm text-muted">
          <span className="text-gold">Coveted.</span> About {Math.round(counts.covetRatio)} people
          want this for every one who owns it.
        </p>
      )}
    </section>
  );
}
