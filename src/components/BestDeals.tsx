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
          Listed low against past sales for the same bag. A read on price, not on
          condition.
        </p>
      </div>

      <ul>
        {deals.map((d) => {
          const name = [d.brandName, d.styleName].filter(Boolean).join(" ");
          const span = d.highPrice - d.lowPrice || 1;
          const markerPct = clamp(((d.currentPrice - d.lowPrice) / span) * 100, 3, 97);
          const medianPct = clamp(((d.medianPrice - d.lowPrice) / span) * 100, 3, 97);

          return (
            <li key={d.variantId} className="border-b border-border px-4 py-3.5">
              <Link
                href={`/bag/${d.variantId}`}
                className="block truncate font-serif text-sm text-foreground transition-colors hover:text-gold"
              >
                {name}
              </Link>

              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-serif text-2xl text-gold-soft">
                  {formatPrice(d.currentPrice, d.currency)}
                </span>
                {d.verdict && (
                  <span className="text-xs font-medium text-gold">
                    {d.verdict === "great" ? "great price" : "good price"}
                  </span>
                )}
              </p>

              <div
                className="relative mt-3 h-1.5 rounded-full bg-border"
                role="img"
                aria-label={`Listed at ${formatPrice(d.currentPrice, d.currency)}, against a recorded median of ${formatPrice(d.medianPrice, d.currency)} (range ${formatPrice(d.lowPrice, d.currency)} to ${formatPrice(d.highPrice, d.currency)})`}
              >
                <span
                  className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 bg-muted/70"
                  style={{ left: `${medianPct}%` }}
                />
                <span
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-soft ring-2 ring-bg"
                  style={{ left: `${markerPct}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px]">
                <span className="text-gold-soft">this listing</span>
                <span className="text-muted">median {formatPrice(d.medianPrice, d.currency)}</span>
              </div>

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
