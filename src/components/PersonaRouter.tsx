import Link from "next/link";
import { getClosetValue } from "@/lib/portfolio";
import { getMarketPulse } from "@/lib/market-pulse";

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
  const [closetValue, pulse] = await Promise.all([getClosetValue(), getMarketPulse()]);
  const topHouses = pulse.byHouse.slice(0, 3);
  const houseMax = topHouses[0]?.observations ?? 0;

  return (
    <section className="border-b border-border px-5 py-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Link
            href="/authentication"
            className="mt-4 text-sm font-medium text-gold transition-colors hover:text-gold-soft"
          >
            Read the authentication guides &rarr;
          </Link>
        </div>

        {/* Tile 2 — Collect & invest (track a whole collection) */}
        <Link href="/closet" className={TILE}>
          <h3 className="font-serif text-xl text-foreground">Collect &amp; invest</h3>
          <p className="mt-1 text-sm text-muted">Save the bags you love. Watch what they&rsquo;re worth.</p>
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
            // Want-led for the aspiring majority: the bags you love, saved. Contained
            // (no full-width curve) so it never spills past the tile at any width.
            <div className="mt-4 flex flex-1 items-center justify-center gap-3">
              <Bag className="h-12 w-12 text-gold/50" />
              <div className="relative">
                <Bag className="h-16 w-16 text-gold" />
                <svg viewBox="0 0 24 24" className="absolute -right-1 -top-1 h-6 w-6 text-gold-soft" fill="currentColor" aria-hidden>
                  <path d="M12 21s-7-4.6-9.4-8.6C1 10 2.6 6.6 6 6.6c2 0 3.1 1.3 4 2.6 0.9-1.3 2-2.6 4-2.6 3.4 0 5 3.4 3.4 5.8C19 16.4 12 21 12 21z" />
                </svg>
              </div>
              <Bag className="h-12 w-12 text-gold/70" />
            </div>
          )}
          <span className={CTA}>Start your closet &rarr;</span>
        </Link>

        {/* Tile 3 — What's it worth? The price-story demo: SHOW the moat the hero only
            states. Value to Sofia/Cross-shopper = don't overpay or undersell. */}
        <Link href="/bag/199" className={TILE}>
          <h3 className="font-serif text-xl text-foreground">What&rsquo;s it worth?</h3>
          <p className="mt-1 text-sm text-muted">Before you buy or sell, see what a bag really trades for, every recorded sale.</p>
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

        {/* Tile 4 — The data behind every page: the data-informed flex. Shows real
            scale + per-house depth (market pulse), never a famous-bag ranking. */}
        <Link href="/data" className={TILE}>
          <h3 className="font-serif text-xl text-foreground">The data behind every page</h3>
          <p className="mt-1 text-sm text-muted">Real resale prices, kept current.</p>
          {pulse.totalPrices > 0 ? (
            <div className="mt-4 flex flex-1 flex-col">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 min-[480px]:grid-cols-4">
                <div>
                  <p className="font-serif text-2xl text-gold">{pulse.totalPrices.toLocaleString()}</p>
                  <p className="text-[11px] text-muted">prices</p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-gold">{pulse.bags.toLocaleString()}</p>
                  <p className="text-[11px] text-muted">bags</p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-gold">{pulse.houses.toLocaleString()}</p>
                  <p className="text-[11px] text-muted">houses</p>
                </div>
                {pulse.earliestYear && (
                  <div>
                    <p className="font-serif text-2xl text-gold">{pulse.earliestYear}</p>
                    <p className="text-[11px] text-muted">earliest price</p>
                  </div>
                )}
              </div>
              {topHouses.length > 0 && (
                <>
                  <p className="mt-5 text-[11px] uppercase tracking-wide text-muted/70">Where our data runs deepest</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {topHouses.map((h) => (
                      <li key={h.name} className="flex items-center gap-2">
                        <span className="w-24 flex-shrink-0 truncate text-[11px] text-foreground">{h.name}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                          <span
                            className="block h-full rounded-full bg-gold"
                            style={{ width: `${houseMax > 0 ? Math.max(4, Math.round((h.observations / houseMax) * 100)) : 0}%` }}
                          />
                        </span>
                        <span className="w-10 flex-shrink-0 text-right text-[11px] text-muted">
                          {h.observations.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p className="mt-4 flex-1 text-sm text-muted">Real resale prices, kept current as new ones come in.</p>
          )}
          <span className={CTA}>See the data &rarr;</span>
        </Link>
      </div>
    </section>
  );
}
