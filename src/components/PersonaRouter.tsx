import Link from "next/link";
import { getClosetValue } from "@/lib/portfolio";

/**
 * "What brings you in?" — the homepage goal-picker. Each tile SHOWS its value
 * (a visual, a real interaction) rather than describing it, and leads a distinct
 * audience to the right surface. Grounded in NN/g information-scent and
 * docs/ux/home-use-case-value-props.md + docs/ux/homepage-experiments.md.
 *
 * Search lives ONCE, in the page hero (Option 1 of the search-IA review), so no
 * tile repeats a search box. Four goal tiles: Is it real, Collect & invest,
 * What's it worth, Find the bag for me. "Best deals" is its own full section
 * (it deserves more than one row), and "Most coveted bags" is content-gated until
 * there's enough want-signal (docs/ux/content-gating-strategy.md) — both live
 * outside this grid now.
 */

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

function Check({ className = "text-gold" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8.5l3 3 7-8" />
    </svg>
  );
}
function Cross({ className = "text-muted" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
function Bag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h16l-1.2 11.2a1 1 0 0 1-1 .8H6.2a1 1 0 0 1-1-.8L4 8z" />
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
    </svg>
  );
}

const CTA = "mt-4 text-sm font-medium text-gold transition-colors group-hover:text-gold-soft";
const TILE = "group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold";

export default async function PersonaRouter() {
  // The Collect & invest tile shows a signed-in collector's real estimated resale
  // total when we have priced bags; the read is resilient (null on any missing
  // env / column / key), so a thin or credential-less environment falls back to
  // the illustrative multi-bag visual.
  const closetValue = await getClosetValue();

  return (
    <section className="border-b border-border px-5 py-12">
      <h2 className="font-serif text-2xl text-foreground">What brings you in?</h2>
      <p className="mt-1 text-sm text-muted">Pick a goal. We&rsquo;ll take you straight there.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Tile 1 — Is it real? The authentication ladder: Learn (read the
            markers) + Check (scan a bag). Two explicit actions, not one camera
            link, so Learn gets a homepage on-ramp too. */}
        <div className={`${TILE} border-gold/40 bg-gold/5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl text-foreground">Is it real?</h3>
              <p className="mt-1 text-sm text-muted">Found a bag in the wild? We can help.</p>
            </div>
            {/* magnifier examining a bag — "study the markers", no camera/scan implied */}
            <svg viewBox="0 0 64 64" className="h-24 w-24 flex-shrink-0 text-gold" fill="none" stroke="currentColor" aria-hidden>
              <path d="M14 20h26l-2 26a2 2 0 0 1-2 1.9H18a2 2 0 0 1-2-1.9z" strokeWidth="1.4" />
              <path d="M21 20v-2.5a6 6 0 0 1 12 0V20" strokeWidth="1.4" />
              <circle cx="41" cy="40" r="11" strokeWidth="2.4" className="text-gold-soft" />
              <path d="M49 48l7.5 7.5" strokeWidth="2.4" strokeLinecap="round" className="text-gold-soft" />
            </svg>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex items-center gap-2 text-foreground"><Check /> Stitching and edges</li>
            <li className="flex items-center gap-2 text-foreground"><Check /> Stamps and date codes</li>
            <li className="flex items-center gap-2 text-muted"><Cross /> Red flags, called out</li>
          </ul>
          <p className="mt-2 text-xs text-muted">Consistent never means authentic. We point you to a human.</p>
          <Link
            href="/articles?department=authentication"
            className="mt-4 text-sm font-medium text-gold transition-colors hover:text-gold-soft"
          >
            Read the authentication guides &rarr;
          </Link>
        </div>

        {/* Tile 2 — Collect & invest (track a whole collection) */}
        <Link href="/closet" className={TILE}>
          <h3 className="font-serif text-xl text-foreground">Collect &amp; invest</h3>
          <p className="mt-1 text-sm text-muted">Track what you own. Watch what it&rsquo;s worth.</p>
          {closetValue ? (
            // Logged-in collector with priced bags: show the real estimated resale
            // total (never fabricated — only bags with resale history are counted).
            <div className="mt-4 flex flex-1 flex-col justify-center">
              <p className="font-serif text-3xl text-gold">
                {formatPrice(closetValue.total, closetValue.currency)}
              </p>
              <p className="mt-1 text-xs text-muted">
                estimated resale across {closetValue.valued} of {closetValue.count}{" "}
                {closetValue.count === 1 ? "bag" : "bags"} you own
              </p>
            </div>
          ) : (
            // A whole collection: several bags, plus the value-over-time curve.
            <div className="mt-4 flex flex-1 items-center justify-between gap-3">
              <div className="flex items-end gap-1.5">
                <Bag className="h-12 w-12 text-gold/55" />
                <Bag className="h-16 w-16 text-gold" />
                <Bag className="h-14 w-14 text-gold/80" />
                <Bag className="h-10 w-10 text-gold/40" />
              </div>
              <svg viewBox="0 0 90 40" className="h-12 w-24 flex-shrink-0 text-gold" fill="none" aria-hidden>
                <path d="M2 34 L20 30 L38 24 L56 22 L74 12 L88 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="88" cy="4" r="3" fill="currentColor" className="text-gold-soft" />
              </svg>
            </div>
          )}
          <span className={CTA}>Track your closet &rarr;</span>
        </Link>

        {/* Tile 3 — What's it worth? (worth demo, not a search box) */}
        <Link href="/bag/199" className={TILE}>
          <h3 className="font-serif text-xl text-foreground">What&rsquo;s it worth?</h3>
          <p className="mt-1 text-sm text-muted">A peek at the full price story behind any bag.</p>
          <div className="mt-5 flex-1">
            <div className="relative">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] text-foreground">median</span>
              <div className="h-2.5 rounded-full bg-gradient-to-r from-border via-gold/40 to-gold" />
              <span className="absolute -top-1 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-foreground" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted"><span>low</span><span>high</span></div>
            <p className="mt-4 text-[11px] text-muted">price over time</p>
            {/* Full-bleed: the curve spans the whole tile, edge to edge (-mx-5
                cancels the p-5 padding; preserveAspectRatio stretches to width). */}
            <div className="-mx-5 mt-1">
              <svg viewBox="0 0 320 48" preserveAspectRatio="none" className="h-14 w-full text-gold" fill="none" aria-hidden>
                <path d="M0 44 L64 38 L128 30 L192 22 L256 13 L320 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <span className={CTA}>See the full price story &rarr;</span>
        </Link>
      </div>
    </section>
  );
}
