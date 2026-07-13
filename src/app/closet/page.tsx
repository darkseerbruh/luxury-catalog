import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCloset, getWatchlist } from "@/lib/collections";
import { getResaleMedians, getClosetValueHistory, type VariantResaleEstimate } from "@/lib/portfolio";
import { getVariantImages } from "@/lib/queries";
import { hasActiveAuthenticators } from "@/lib/authentication";
import { BagImage } from "@/components/BagImage";
import AuthInterestButton from "@/components/AuthInterestButton";
import TrackView from "@/components/TrackView";

export const dynamic = "force-dynamic";

export const metadata = { title: "My closet · Luxury Catalog" };

const STATUS_LABELS: Record<string, string> = {
  want: "Want",
  have: "Have",
  had: "Had",
};

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

// TODO(migration): add closet_item.purchase_price for cost-basis + gain/loss.
// Without an acquisition price column we can only show estimated value from the
// catalogued retail_price_original — never realized/unrealized gain or loss.

/**
 * WatchCharts-style portfolio rollup computed purely from getCloset() data:
 * sum of retail_price for 'have' items, aspirational sum for 'want' items, and
 * counts per status. Values use the dominant currency among priced items so the
 * symbol is honest; items with no catalogued price are excluded from the totals
 * (but still counted) rather than treated as zero.
 */
function buildPortfolio(
  closet: { status: string; variantId: number; retailPrice: number | null; currency: string | null }[],
  medians: Map<number, VariantResaleEstimate>,
) {
  // Per-bag value = the recorded resale median (the market's answer) with the
  // catalogued retail as a LABELED fallback — the homepage tile, this header,
  // and the report all read the same engine now (they used to disagree).
  function summarize(status: string) {
    const items = closet.filter((c) => c.status === status);
    const totals = new Map<string, number>(); // per-currency, never blended
    let resaleValued = 0;
    let retailValued = 0;
    for (const c of items) {
      const est = medians.get(c.variantId);
      if (est) {
        const cur = est.currency ?? "USD";
        totals.set(cur, (totals.get(cur) ?? 0) + est.median);
        resaleValued += 1;
      } else if (c.retailPrice != null) {
        const cur = c.currency ?? "USD";
        totals.set(cur, (totals.get(cur) ?? 0) + c.retailPrice);
        retailValued += 1;
      }
    }
    // Dominant currency leads the display; the rest are shown alongside.
    const ordered = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return {
      count: items.length,
      resaleValued,
      retailValued,
      pricedCount: resaleValued + retailValued,
      totals: ordered.map(([cur, amount]) => ({ currency: cur, amount: Math.round(amount) })),
      total: ordered[0]?.[1] != null ? Math.round(ordered[0][1]) : null,
      currency: ordered[0]?.[0] ?? null,
    };
  }
  return {
    have: summarize("have"),
    want: summarize("want"),
    had: summarize("had"),
  };
}

export default async function ClosetPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const closet = await getCloset();
  // Alert state lives on the watchlist (the "want" set). Merge it in so each Want
  // row can show whether its price alert is on, per the bell, as a data point.
  const watchlist = await getWatchlist();
  const alertOn = new Map(watchlist.map((w) => [w.variantId, w.alertEnabled]));
  const images = await getVariantImages(closet.map((c) => c.variantId));
  const authComingSoon = !(await hasActiveAuthenticators());

  const medians = await getResaleMedians(closet.map((c) => c.variantId));
  const valueHistory = await getClosetValueHistory();
  const portfolio = buildPortfolio(closet, medians);

  const groups: { key: string; label: string }[] = [
    { key: "have", label: "Have" },
    { key: "want", label: "Want" },
    { key: "had", label: "Had" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Your closet</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Saved bags</h1>
        <p className="mt-2 text-muted">
          The ones you want, the ones you have, the ones you used to. All in one place.
        </p>
        <Link
          href="/closet/add"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          + Add a bag
        </Link>
      </header>

      {closet.length > 0 && (
        <section
          className="rounded-2xl border border-border bg-surface p-5"
          aria-label="Collection portfolio summary"
        >
          <TrackView
            event="closet_value_viewed"
            props={{
              have_count: portfolio.have.count,
              valued: portfolio.have.resaleValued,
              has_history: valueHistory.length >= 2,
            }}
          />
          <p className="text-sm uppercase tracking-widest text-muted">
            Your collection
          </p>
          <p className="mt-1 font-serif text-2xl text-foreground">
            {portfolio.have.totals.length > 0
              ? portfolio.have.totals
                  .map((t) => formatPrice(t.amount, t.currency))
                  .join(" + ")
              : "—"}{" "}
            <span className="text-muted">
              across {portfolio.have.count} {portfolio.have.count === 1 ? "bag" : "bags"} you have
            </span>
          </p>
          <p className="mt-1 text-xs text-muted/70">
            Resale-median estimate, not an appraisal
            {portfolio.have.retailValued > 0
              ? ` · ${portfolio.have.retailValued} at catalogued retail (no resale history yet)`
              : ""}
            {portfolio.have.pricedCount < portfolio.have.count
              ? ` · ${portfolio.have.count - portfolio.have.pricedCount} without a price not counted`
              : ""}
          </p>

          {/* Value over time — from weekly snapshots (migration 0043); renders
              only once two points exist, never a fabricated curve. */}
          {valueHistory.length >= 2 && (() => {
            const pts = valueHistory;
            const min = Math.min(...pts.map((p) => p.total));
            const max = Math.max(...pts.map((p) => p.total));
            const span = Math.max(max - min, 1);
            const coords = pts
              .map((p, i) => {
                const x = (i / (pts.length - 1)) * 100;
                const y = 28 - ((p.total - min) / span) * 24;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            const first = pts[0];
            const last = pts[pts.length - 1];
            return (
              <div className="mt-3">
                <svg
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                  className="h-8 w-full"
                  role="img"
                  aria-label={`Collection value from ${formatPrice(first.total, first.currency)} on ${first.takenOn} to ${formatPrice(last.total, last.currency)} on ${last.takenOn}`}
                >
                  <polyline
                    points={coords}
                    fill="none"
                    stroke="var(--color-gold)"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <p className="mt-1 text-xs text-muted/70">
                  Since {first.takenOn}: {formatPrice(first.total, first.currency)} →{" "}
                  {formatPrice(last.total, last.currency)} · weekly snapshots
                </p>
              </div>
            );
          })()}

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat
              label="Have"
              count={portfolio.have.count}
              sub={formatPrice(portfolio.have.total, portfolio.have.currency)}
            />
            <Stat
              label="Want"
              count={portfolio.want.count}
              sub={
                portfolio.want.total != null && portfolio.want.total > 0
                  ? `${formatPrice(portfolio.want.total, portfolio.want.currency)} wishlist`
                  : null
              }
            />
            <Stat label="Had" count={portfolio.had.count} sub={null} />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link
              href="/closet/report"
              className="text-gold transition-colors hover:text-gold-soft"
            >
              Collection report →
            </Link>
            <Link
              href="/recap"
              className="text-gold transition-colors hover:text-gold-soft"
            >
              See your Year in Bags →
            </Link>
          </div>
        </section>
      )}

      {(portfolio.have.count + portfolio.had.count) > 0 && authComingSoon && (
        <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <p className="font-serif text-lg text-foreground">Authenticate before you sell or insure</p>
          <p className="mt-1 mb-3 text-sm text-muted">
            Pro authentication is coming soon, useful before you sell, consign, or insure a
            piece. Want first access?
          </p>
          <AuthInterestButton signedIn source="closet" />
        </section>
      )}

      {closet.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">Nothing in your closet yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Found one you love? Hit <span className="text-gold">Save this bag</span> on
            any bag and it lands here.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        groups.map((g) => {
          const items = closet.filter((c) => c.status === g.key);
          if (items.length === 0) return null;
          return (
            <section key={g.key}>
              <h2 className="mb-3 font-serif text-xl text-foreground">
                {g.label}{" "}
                <span className="text-sm text-muted">({items.length})</span>
              </h2>
              {g.key === "have" && (
                <p className="mb-3 text-sm text-muted">
                  Keeping them? The{" "}
                  <Link href="/care" className="text-gold transition-colors hover:text-gold-soft">
                    care shelf →
                  </Link>{" "}
                  has the shapers, cleaners, and covers we&rsquo;d reach for, by material. Thinking
                  of parting with one instead? Each bag&rsquo;s{" "}
                  <span className="text-foreground">Where to sell</span> shows what you&rsquo;d
                  keep at every venue, from real published fees.
                </p>
              )}
              {g.key === "want" && (
                <p className="mb-3 text-sm text-muted">
                  The bell shows whether a price alert is on.{" "}
                  <Link href="/watchlist" className="text-gold transition-colors hover:text-gold-soft">
                    Manage alerts →
                  </Link>
                </p>
              )}
              <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
                {items.map((c) => (
                  <li key={c.variantId}>
                    <Link
                      href={`/bag/${c.variantId}`}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-raised/40"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <BagImage
                          imageUrl={images[c.variantId]}
                          brand={c.brandName}
                          className="h-14 w-14 shrink-0 rounded-lg"
                        />
                        <div className="min-w-0">
                        <p className="text-sm uppercase tracking-wide text-muted">
                          {c.brandName}
                        </p>
                        <p className="font-serif text-foreground">{c.styleName}</p>
                        <p className="text-sm text-muted">
                          {c.status === "want" && c.wantSpec
                            ? c.wantSpec.colorFamily
                              ? `Any ${c.wantSpec.colorFamily.toLowerCase()}`
                              : "Any colourway"
                            : c.label}
                        </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-right">
                        {c.status === "want" && <Bell on={alertOn.get(c.variantId) ?? false} />}
                        <div>
                          {formatPrice(c.retailPrice, c.currency) && (
                            <p className="text-sm text-gold">
                              {formatPrice(c.retailPrice, c.currency)}
                            </p>
                          )}
                          <p className="mt-1 text-xs uppercase tracking-wide text-muted/70">
                            {STATUS_LABELS[c.status] ?? c.status}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </main>
  );
}

/** Read-only alert indicator on a Want row: gold filled when a price alert is on,
 * muted outline when off. Toggle the alert on the bag page (the bell there). */
function Bell({ on }: { on: boolean }) {
  return (
    <span
      title={on ? "Price alert on" : "No price alert"}
      aria-label={on ? "Price alert on" : "No price alert"}
      className={on ? "text-gold" : "text-muted/40"}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    </span>
  );
}

function Stat({
  label,
  count,
  sub,
}: {
  label: string;
  count: number;
  sub: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised/40 px-3 py-3">
      <p className="font-serif text-xl text-foreground">{count}</p>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-gold">{sub}</p>}
    </div>
  );
}
