import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCloset } from "@/lib/collections";
import { getVariantImages } from "@/lib/queries";
import { BagImage } from "@/components/BagImage";

export const dynamic = "force-dynamic";

export const metadata = { title: "My closet · The Luxury Catalog" };

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
function buildPortfolio(closet: { status: string; retailPrice: number | null; currency: string | null }[]) {
  function summarize(status: string) {
    const items = closet.filter((c) => c.status === status);
    const priced = items.filter((c) => c.retailPrice != null);
    const total = priced.reduce((sum, c) => sum + (c.retailPrice ?? 0), 0);
    // Dominant currency among priced items, for an honest symbol.
    const currencyCounts = new Map<string, number>();
    for (const c of priced) {
      const cur = c.currency ?? "USD";
      currencyCounts.set(cur, (currencyCounts.get(cur) ?? 0) + 1);
    }
    let currency: string | null = null;
    let best = -1;
    for (const [cur, n] of currencyCounts) {
      if (n > best) { best = n; currency = cur; }
    }
    return { count: items.length, pricedCount: priced.length, total, currency };
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
  const images = await getVariantImages(closet.map((c) => c.variantId));

  const portfolio = buildPortfolio(closet);

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
          The ones you want, the ones you have, the ones you used to — all in one place.
        </p>
      </header>

      {closet.length > 0 && (
        <section
          className="rounded-2xl border border-border bg-surface p-5"
          aria-label="Collection portfolio summary"
        >
          <p className="text-sm uppercase tracking-widest text-muted">
            Your collection
          </p>
          <p className="mt-1 font-serif text-2xl text-foreground">
            {formatPrice(portfolio.have.total, portfolio.have.currency) ?? "—"}{" "}
            <span className="text-muted">
              across {portfolio.have.count} {portfolio.have.count === 1 ? "bag" : "bags"} you have
            </span>
          </p>
          {portfolio.have.pricedCount < portfolio.have.count && (
            <p className="mt-1 text-xs text-muted/70">
              Estimated from catalogued retail prices · {portfolio.have.count - portfolio.have.pricedCount} item
              {portfolio.have.count - portfolio.have.pricedCount === 1 ? "" : "s"} without a price not counted
            </p>
          )}

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
                portfolio.want.total > 0
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
                        <p className="text-sm text-muted">{c.label}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {formatPrice(c.retailPrice, c.currency) && (
                          <p className="text-sm text-gold">
                            {formatPrice(c.retailPrice, c.currency)}
                          </p>
                        )}
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted/70">
                          {STATUS_LABELS[c.status] ?? c.status}
                        </p>
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
