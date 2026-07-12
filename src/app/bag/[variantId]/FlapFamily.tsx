import Link from "next/link";
import type { FlapFamily as FlapFamilyData, FlapSibling } from "@/lib/flap-family";

/**
 * "How this bag relates to its cousins" module. Renders on any bag whose style belongs to
 * a `style_family` (today: the Chanel flaps). It answers the three questions a buyer has
 * when two look-alike flaps are priced 3-4x apart: is this the classic one, will I see it
 * again, and why the price gap. Structure (single/double) + status (permanent/retired) are
 * the levers; the median is our read of recorded resale, never an appraisal.
 */

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

function StructureChip({ structure }: { structure: FlapSibling["structure"] }) {
  if (!structure) return null;
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
      {structure === "double" ? "Double flap" : "Single flap"}
    </span>
  );
}

function StatusChip({ sib }: { sib: FlapSibling }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
        sib.discontinued ? "border border-gold/40 bg-gold/5 text-gold" : "border border-border text-muted"
      }`}
    >
      {sib.status}
    </span>
  );
}

/** One-line orientation for the page you're on. */
function orientation(current: FlapSibling | undefined): string {
  if (!current) return "";
  if (current.structure === "double") {
    return "This is the double-flap Classic (the “11.12”). The others in the family are single-flap cousins, different bags at different prices.";
  }
  if (current.discontinued) {
    return `This is a single-flap ${current.name}, discontinued, so it won't be remade. The double-flap Classic is the permanent icon.`;
  }
  return "This is a single-flap mini, a permanent shape remade every season. The double-flap Classic is the icon of the line.";
}

export default function FlapFamily({ family, articleSlug }: { family: FlapFamilyData; articleSlug?: string }) {
  if (family.siblings.length < 2) return null;

  return (
    <section aria-label="How this bag relates to the family" className="rounded-2xl border border-border bg-surface/50 p-5">
      <h2 className="font-serif text-lg text-foreground">How the Chanel flaps relate</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{orientation(family.current)}</p>

      <ul className="mt-4 flex flex-col divide-y divide-border/60">
        {family.siblings.map((s) => {
          const inner = (
            <div className={`flex flex-col gap-1.5 py-3 ${s.isCurrent ? "opacity-100" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-serif text-[15px] ${s.isCurrent ? "text-gold-soft" : "text-foreground"}`}>
                  {s.name}
                </span>
                {s.isCurrent && <span className="text-[10px] uppercase tracking-wide text-gold">you&rsquo;re here</span>}
                {s.alsoCalled && <span className="text-xs text-muted/70">({s.alsoCalled})</span>}
                <StructureChip structure={s.structure} />
                <StatusChip sib={s} />
                {s.medianPrice != null && s.sampleSize > 0 && (
                  <span className="text-xs text-muted">
                    median {formatPrice(s.medianPrice, s.currency)}{" "}
                    <span className="text-muted/60">({s.sampleSize} recorded)</span>
                  </span>
                )}
              </div>
              {s.pickThisIf && <p className="text-xs leading-relaxed text-muted">Pick this if: {s.pickThisIf}</p>}
            </div>
          );
          // The current bag isn't a link (you're on it); the others link to their page.
          return (
            <li key={s.styleId}>
              {s.isCurrent || s.variantId == null ? (
                inner
              ) : (
                <Link href={`/bag/${s.variantId}`} className="block transition-colors hover:bg-surface">
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {/* Why the size names confuse everyone — collapsed by default so it never walls the
          page; short sourced beats inside. */}
      <details className="mt-4 border-t border-border/60 pt-3">
        <summary className="cursor-pointer text-sm font-medium text-foreground marker:text-gold">
          Why are the sizes named so many things?
        </summary>
        <div className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-muted">
          <p>Two vocabularies that never fully matched:</p>
          <ul className="ml-4 flex flex-col gap-1">
            <li>Chanel&rsquo;s boutiques say Small, Medium, <strong>Large</strong>, Maxi.</li>
            <li>The resale world says Small, Medium (or &ldquo;M/L&rdquo;), <strong>Jumbo</strong>, Maxi.</li>
          </ul>
          <p>So the &ldquo;Jumbo&rdquo; everyone says is Chanel&rsquo;s &ldquo;Large,&rdquo; and the ~25.5 cm &ldquo;Medium&rdquo; has also been called the &ldquo;M/L&rdquo; (Medium/Large) over the years.</p>
          <p>It shifted again in <strong>March 2024</strong>: Chanel relabeled the Medium on its own site as the &ldquo;11.12&rdquo; (after its style code, A01112) and dropped the word &ldquo;Medium.&rdquo;</p>
          <p>The reliable anchor is the measurement and the style code, not the size word. That&rsquo;s why we print the cm next to every size.</p>
        </div>
      </details>

      <p className="mt-3 text-xs text-muted/70">
        Medians are our read of recorded resale, not an appraisal. Structure and status move the price more than the look.
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
