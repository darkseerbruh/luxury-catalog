import Link from "next/link";
import type { FlapLines as FlapLinesData, FlapLine } from "@/lib/flap-lines";

/**
 * "Which Chanel flap line is this?" module. Sits one level above the within-family module:
 * it compares the confusable LINES a shopper weighs against each other — the Classic Flap
 * ("11.12"), the 2.55 Reissue, the Boy, and the Wallet on Chain. They share the quilt-and-
 * chain look but differ by CLOSURE and STRUCTURE, which is what moves the price. The median
 * is our read of recorded resale, never an appraisal.
 */

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

function StructureChip({ structure }: { structure: FlapLine["structure"] }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
      {structure === "double" ? "Double flap" : "Single flap"}
    </span>
  );
}

/** One-line orientation for the line you're on. */
function orientation(current: FlapLine | undefined): string {
  if (!current) return "";
  return `You're on the ${current.name} line. Chanel makes four flap lines that look alike but close differently, and the closure moves the price more than the color.`;
}

export default function FlapLines({ lines, articleSlug }: { lines: FlapLinesData; articleSlug?: string }) {
  if (lines.lines.length < 2) return null;

  return (
    <section
      aria-label="Which Chanel flap line is this"
      className="rounded-2xl border border-border bg-surface/50 p-5"
    >
      <h2 className="font-serif text-lg text-foreground">The four Chanel flap lines</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{orientation(lines.current)}</p>

      <ul className="mt-4 flex flex-col divide-y divide-border/60">
        {lines.lines.map((l) => {
          const inner = (
            <div className="flex flex-col gap-1.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-serif text-[15px] ${l.isCurrent ? "text-gold-soft" : "text-foreground"}`}>
                  {l.name}
                </span>
                {l.isCurrent && <span className="text-[10px] uppercase tracking-wide text-gold">you&rsquo;re here</span>}
                {l.alsoCalled && <span className="text-xs text-muted/70">({l.alsoCalled})</span>}
                <StructureChip structure={l.structure} />
                {l.introYear != null && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                    since {l.introYear}
                  </span>
                )}
                {l.medianPrice != null && l.sampleSize > 0 && (
                  <span className="text-xs text-muted">
                    median {formatPrice(l.medianPrice, l.currency)}{" "}
                    <span className="text-muted/60">({l.sampleSize} recorded)</span>
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted">
                <span className="text-muted/80">The tell:</span> {l.tell}
              </p>
              {l.pickThisIf && <p className="text-xs leading-relaxed text-muted">Pick this if: {l.pickThisIf}</p>}
            </div>
          );
          // The current line isn't a link (you're on it); the others link to their page.
          return (
            <li key={l.familyKey}>
              {l.isCurrent || l.variantId == null ? (
                inner
              ) : (
                <Link href={`/bag/${l.variantId}`} className="block transition-colors hover:bg-surface">
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-muted/70">
        Medians are our read of recorded resale, not an appraisal. The closure and structure move the price more than the look.
        {articleSlug && (
          <>
            {" "}
            <Link href={`/articles/${articleSlug}`} className="text-gold hover:text-gold-soft">
              The full flap decoder &rarr;
            </Link>
          </>
        )}
      </p>
    </section>
  );
}
