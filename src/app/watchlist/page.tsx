import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWatchlist } from "@/lib/collections";
import WatchControls from "./WatchControls";
import PremiumInterest from "@/components/PremiumInterest";

export const dynamic = "force-dynamic";

export const metadata = { title: "My watchlist · The Luxury Catalog" };

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export default async function WatchlistPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const watchlist = await getWatchlist();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Watchlist</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Price tracking</h1>
        <p className="mt-2 text-muted">
          Name your number on any bag. When a recorded sale price hits or drops below it,
          we&rsquo;ll tell you here.
        </p>
      </header>

      {watchlist.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">You&rsquo;re not tracking any prices yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Open any bag and tap <span className="text-gold">Watch price</span> to follow what it sells for.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {watchlist.map((w) => {
            const belowTarget =
              w.targetPrice != null && w.latestSalePrice != null && w.latestSalePrice <= w.targetPrice;
            return (
              <li key={w.variantId} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/bag/${w.variantId}`} className="group">
                    <p className="text-sm uppercase tracking-wide text-muted">{w.brandName}</p>
                    <p className="font-serif text-foreground group-hover:text-gold">{w.styleName}</p>
                    <p className="text-sm text-muted">{w.label}</p>
                  </Link>
                  <div className="shrink-0 text-right text-sm">
                    {formatPrice(w.retailPrice, w.currency) && (
                      <p className="text-muted">{formatPrice(w.retailPrice, w.currency)} retail</p>
                    )}
                    {w.latestSalePrice != null && (
                      <p className={belowTarget ? "text-gold" : "text-foreground"}>
                        last {formatPrice(w.latestSalePrice, w.currency)}
                      </p>
                    )}
                  </div>
                </div>

                {belowTarget && (
                  <p className="mt-3 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 text-sm text-gold">
                    Below your target of {formatPrice(w.targetPrice, w.currency)}.
                  </p>
                )}

                <WatchControls
                  variantId={w.variantId}
                  initialTarget={w.targetPrice}
                  initialAlert={w.alertEnabled}
                  initialMode={w.alertMode}
                  initialPct={w.alertPct}
                />
              </li>
            );
          })}
        </ul>
      )}

      <PremiumInterest surface="watchlist" />
    </main>
  );
}
