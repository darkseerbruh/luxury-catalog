import Link from "next/link";
import { TASTE_QUESTIONS } from "@/lib/taste";
import { getDeals } from "@/lib/deals";
import { getMostWantedBags } from "@/lib/coveted-bags";
import { getClosetValue } from "@/lib/portfolio";

/**
 * "What brings you in?" — the homepage goal-picker. Each tile SHOWS its value
 * (a visual, a real interaction) rather than describing it, and leads a distinct
 * audience to the right surface. Grounded in NN/g information-scent and
 * docs/ux/home-use-case-value-props.md + docs/ux/homepage-experiments.md.
 *
 * Search lives ONCE, in the page hero (Option 1 of the search-IA review), so no
 * tile repeats a search box. The data tiles (deals, most-wanted) preview their
 * REAL #1 row when data exists — every figure is a recorded value, never
 * fabricated (never-invent). When the DB is unreachable or the signal isn't there
 * yet, each tile degrades to its illustrative, unlabeled visual. The full ranked
 * lists live on /deals and /coveted; both reads are resilient and return [].
 */

const Q1 = TASTE_QUESTIONS[0];

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
  // Live #1 rows for the data tiles. Both reads are resilient (return [] on any
  // missing env / column / key), so a thin or credential-less environment simply
  // falls back to the illustrative visuals below.
  const [topDeals, topWanted, closetValue] = await Promise.all([
    getDeals(1),
    getMostWantedBags(1),
    getClosetValue(),
  ]);
  const topDeal = topDeals[0] ?? null;
  const topBag = topWanted[0] ?? null;
  const dealName = topDeal ? [topDeal.brandName, topDeal.styleName].filter(Boolean).join(" ") : "";
  const bagName = topBag ? [topBag.brandName, topBag.styleName].filter(Boolean).join(" ") : "";

  return (
    <section className="border-b border-border px-5 py-12">
      <h2 className="font-serif text-2xl text-foreground">What brings you in?</h2>
      <p className="mt-1 text-sm text-muted">Pick a goal. We&rsquo;ll take you straight there.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Tile 1 — Is it real? (the photographable authentication hook) */}
        <Link href="/identify" className={`${TILE} border-gold/40 bg-gold/5 hover:border-gold`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl text-foreground">Is it real?</h3>
              <p className="mt-1 text-sm text-muted">Found a bag in the wild? We can help.</p>
            </div>
            {/* phone photographing a bag — makes the camera action obvious */}
            <svg viewBox="0 0 44 64" className="h-16 w-11 flex-shrink-0 text-gold" fill="none" stroke="currentColor" aria-hidden>
              <rect x="2" y="2" width="40" height="60" rx="7" strokeWidth="1.5" />
              <rect x="7" y="9" width="30" height="40" rx="3" className="text-border" strokeWidth="1.2" />
              <g strokeWidth="1.2" strokeLinecap="round">
                <path d="M12 16v-3h3M32 13h3v3M12 45h3M32 45h3" />
              </g>
              <g transform="translate(15,22)" strokeWidth="0.9" opacity="0.8">
                <path d="M1 4h12l-1 9a1 1 0 0 1-1 .9H4a1 1 0 0 1-1-.9z" />
                <path d="M4.5 4V3a3 3 0 0 1 6 0v1" />
              </g>
              <circle cx="22" cy="55" r="3.5" strokeWidth="1.5" />
            </svg>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex items-center gap-2 text-foreground"><Check /> Stitching and edges</li>
            <li className="flex items-center gap-2 text-foreground"><Check /> Stamps and date codes</li>
            <li className="flex items-center gap-2 text-muted"><Cross /> Red flags, called out</li>
          </ul>
          <p className="mt-2 text-xs text-muted">Consistent never means authentic. We point you to a human.</p>
          <span className={CTA}>Scan a bag &rarr;</span>
        </Link>

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
            <div className="mt-4 flex flex-1 items-center gap-3">
              <Bag className="h-10 w-10 text-gold/50" />
              <Bag className="h-12 w-12 text-gold/80" />
              <Bag className="h-10 w-10 text-gold/50" />
              <svg viewBox="0 0 90 40" className="ml-auto h-10 w-24 text-gold" fill="none" aria-hidden>
                <path d="M2 34 L20 30 L38 24 L56 22 L74 12 L88 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
            <svg viewBox="0 0 320 40" className="mt-1 h-10 w-full text-gold" fill="none" aria-hidden>
              <path d="M2 36 L60 32 L120 28 L180 20 L240 14 L318 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <span className={CTA}>See the full price story &rarr;</span>
        </Link>

        {/* Tile 4 — Find the bag for me (the quiz starts inline) */}
        <div className={`${TILE} hover:border-border`}>
          <h3 className="font-serif text-xl text-foreground">Find the bag for me</h3>
          <p className="mt-1 text-sm text-muted">{Q1.prompt}</p>
          <div className="mt-3 flex flex-1 flex-col gap-2">
            {Q1.options.map((opt) => (
              <Link
                key={opt.value}
                href={`/quiz?seed=${encodeURIComponent(opt.value)}`}
                className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold-soft"
              >
                {opt.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Question 1 of {TASTE_QUESTIONS.length}.{" "}
            <span className="text-gold">No account needed.</span>
          </p>
        </div>

        {/* Tile 5 — Best deals right now. Previews the real #1 deal when we have
            a listing under median; otherwise the illustrative chart. */}
        <Link href="/shop?deals=1&sort=best-deal" className={TILE}>
          <h3 className="font-serif text-xl text-foreground">Best deals right now</h3>
          <p className="mt-1 text-sm text-muted">Listings priced under the resale median.</p>
          {topDeal ? (
            <div className="mt-4 flex flex-1 flex-col justify-center">
              <p className="text-xs uppercase tracking-wide text-muted">Biggest gap right now</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-serif text-foreground">{dealName}</span>
                <span className="flex-shrink-0 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold-soft">
                  {topDeal.pctUnder}% under
                </span>
              </div>
              <p className="mt-1 text-sm">
                <span className="text-foreground">{formatPrice(topDeal.currentPrice, topDeal.currency)}</span>
                <span className="text-muted"> vs. {formatPrice(topDeal.medianPrice, topDeal.currency)} median</span>
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-1 items-center">
              <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold-soft">under median</span>
              <svg viewBox="0 0 60 24" className="ml-3 h-6 w-16 text-gold" fill="none" aria-hidden>
                <path d="M2 4 L20 10 L38 16 L58 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M58 22 l-6 -2 m6 2 l-2 -6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          )}
          <span className={CTA}>See today&rsquo;s deals &rarr;</span>
        </Link>

        {/* Tile 6 — Most coveted bags (distinct from coveted closets; /coveted
            ranks). Previews the real #1 most-wanted bag when there's want signal. */}
        <Link href="/coveted" className={TILE}>
          <h3 className="font-serif text-xl text-foreground">Most coveted bags</h3>
          <p className="mt-1 text-sm text-muted">The bags the most people want right now.</p>
          {topBag ? (
            <div className="mt-4 flex flex-1 flex-col justify-center">
              <p className="text-xs uppercase tracking-wide text-gold">#1 right now</p>
              <p className="mt-1.5 truncate font-serif text-foreground">{bagName}</p>
              <p className="mt-1 text-sm text-muted">
                {topBag.wantCount} {topBag.wantCount === 1 ? "person wants it" : "people want it"}
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-1 items-center gap-2 text-muted">
              <Bag className="h-8 w-8 text-gold/70" />
              <Bag className="h-8 w-8 text-gold/45" />
              <Bag className="h-8 w-8 text-gold/30" />
            </div>
          )}
          <span className={CTA}>See the most-wanted bags &rarr;</span>
        </Link>
      </div>
    </section>
  );
}
