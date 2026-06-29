import Link from "next/link";
import { type Deal, MIN_DEALS_TO_RENDER } from "@/lib/deals";
import { DealBuyButton } from "@/components/DealBuyButton";

/**
 * "Priced well today" — a narrow research rail (paired with "It bags" on the home
 * page), NOT a bargain carousel. Each row grades a current listing against the bag's
 * OWN recorded resale range — low / median / high — and links out to the listing.
 *
 * Deliberately image-free: the credibility is the price read, not a photo. The verdict
 * ("great" / "good") is OUR read of recorded sales, never an appraisal, and is only
 * shown when there are >= 5 recorded sales (getDeals gates this). Resilient by
 * contract: getDeals returns [] on any missing env / column / query error, and we
 * render nothing below the minimum, so a thin or credential-less environment omits it.
 */

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export default function BestDeals({ deals }: { deals: Deal[] }) {
  if (deals.length < MIN_DEALS_TO_RENDER) return null;

  return (
    <aside
      aria-label="Priced well today"
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="border-b border-border px-4 py-3.5">
        <h2 className="font-serif text-xl text-foreground">Priced well today</h2>
        <p className="mt-1 text-xs text-muted">
          Low against the sales we&rsquo;ve recorded. Our read, not an appraisal.
        </p>
      </div>

      <ul>
        {deals.map((d) => {
          const name = [d.brandName, d.styleName].filter(Boolean).join(" ");
          const under = d.medianPrice - d.currentPrice;
          const span = d.highPrice - d.lowPrice || 1;
          const markerPct = clamp(((d.currentPrice - d.lowPrice) / span) * 100, 3, 97);
          const medianPct = clamp(((d.medianPrice - d.lowPrice) / span) * 100, 3, 97);

          return (
            <li key={d.variantId} className="border-b border-border px-4 py-3.5">
              <div className="flex items-center gap-2">
                {d.verdict && (
                  <span
                    className={
                      d.verdict === "great"
                        ? "flex-shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-bg"
                        : "flex-shrink-0 rounded-full border border-gold/40 bg-surface-raised px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold-soft"
                    }
                  >
                    {d.verdict}
                  </span>
                )}
                <Link
                  href={`/bag/${d.variantId}`}
                  className="min-w-0 flex-1 truncate font-serif text-sm text-foreground transition-colors hover:text-gold"
                >
                  {name}
                </Link>
                <span className="flex-shrink-0 font-serif text-sm text-gold-soft">
                  {formatPrice(d.currentPrice, d.currency)}
                </span>
              </div>

              <div
                className="relative mt-2.5 h-1.5 rounded-full bg-border"
                role="img"
                aria-label={`Listed at ${formatPrice(d.currentPrice, d.currency)}, lower than ${d.pctCheaper}% of ${d.sampleSize} recorded sales (range ${formatPrice(d.lowPrice, d.currency)} to ${formatPrice(d.highPrice, d.currency)}, median ${formatPrice(d.medianPrice, d.currency)})`}
              >
                <span
                  className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-muted/70"
                  style={{ left: `${medianPct}%` }}
                />
                <span
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-soft"
                  style={{ left: `${markerPct}%` }}
                />
              </div>

              <p className="mt-1.5 text-[11px] text-muted/80">
                {formatPrice(under, d.currency)} under median &middot; n={d.sampleSize}
              </p>

              <DealBuyButton
                variantId={d.variantId}
                brand={d.brandName}
                style={d.styleName}
                platform={d.platform}
                url={d.sourceUrl}
              />
            </li>
          );
        })}
      </ul>

      <Link
        href="/shop?deals=1&sort=best-deal"
        className="block px-4 py-3 text-center text-xs text-gold transition-colors hover:text-gold-soft"
      >
        See all deals
      </Link>
    </aside>
  );
}
