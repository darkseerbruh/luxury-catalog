import Link from "next/link";
import type { Grail } from "@/lib/grails";
import { MAX_GRAILS } from "@/lib/grails";

/**
 * Poster-style "Four Grails" display (UX #14, Letterboxd "Four Favorites").
 * Scarcity framing — exactly four slots, screenshot-worthy. Shared by the public
 * profile and the owner's /profile. Empty slots render as quiet placeholders so
 * the four-up grid is always intact; renders nothing for a stranger with none.
 */
export default function FourGrails({
  grails,
  isOwn = false,
}: {
  grails: Grail[];
  isOwn?: boolean;
}) {
  const filled = [...grails].sort((a, b) => a.position - b.position).slice(0, MAX_GRAILS);

  // A visitor looking at someone who hasn't picked any: show nothing.
  if (filled.length === 0 && !isOwn) return null;

  const byPosition = new Map(filled.map((g) => [g.position, g]));
  const slots = Array.from({ length: MAX_GRAILS }, (_, i) => byPosition.get(i + 1) ?? null);

  return (
    <section aria-label="My Four Grails">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">My Four Grails</h2>
        <p className="text-xs uppercase tracking-widest text-muted">Exactly four</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((g, i) =>
          g ? (
            <Link
              key={g.variantId}
              href={`/bag/${g.variantId}`}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl border border-gold/30 bg-surface-raised p-4 transition-colors hover:border-gold"
            >
              <span className="absolute left-3 top-3 font-serif text-3xl text-gold/30 transition-colors group-hover:text-gold/50">
                {i + 1}
              </span>
              <p className="text-[0.65rem] uppercase tracking-wide text-muted">{g.brandName}</p>
              <p className="mt-1 font-serif leading-tight text-foreground">{g.styleName}</p>
              <p className="mt-1 text-xs text-muted">{g.label}</p>
            </Link>
          ) : (
            <div
              key={`empty-${i}`}
              className="flex aspect-[3/4] flex-col justify-end rounded-2xl border border-dashed border-border bg-surface/40 p-4"
            >
              <span className="font-serif text-3xl text-border">{i + 1}</span>
              <p className="mt-1 text-xs text-muted/70">
                {isOwn ? "Pick a grail" : "—"}
              </p>
            </div>
          )
        )}
      </div>

      {isOwn && (
        <p className="mt-3 text-xs text-muted">
          Four bags, no more — the constraint is the point.{" "}
          <Link href="/profile/edit" className="text-gold hover:underline">
            Choose your four
          </Link>
        </p>
      )}
    </section>
  );
}
