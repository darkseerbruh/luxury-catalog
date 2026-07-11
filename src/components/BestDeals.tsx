import Link from "next/link";
import { type Deal, MIN_DEALS_TO_RENDER } from "@/lib/deals";
import { DealBuyButton } from "@/components/DealBuyButton";

/**
 * "Priced well today" — a full-width home section (stacked, NOT a sidebar). Each card
 * grades a current listing against the bag's OWN recorded resale range — low / median /
 * high — and links out to the listing.
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

export default function BestDeals({ deals }: { deals: Deal[] }) {
  if (deals.length < MIN_DEALS_TO_RENDER) return null;

  return (
    <section aria-label="Priced well today" className="border-b border-border px-5 py-12">
      <h2 className="font-serif text-2xl text-foreground">Priced well today</h2>
      <p className="mt-1 text-sm text-muted">
        Listed low against past sales for the same bag. A read on price, not on condition.
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((d) => {
          const name = [d.brandName, d.styleName].filter(Boolean).join(" ");

          return (
            <li key={d.variantId} className="rounded-2xl border border-border bg-surface p-4">
              <Link
                href={`/bag/${d.variantId}`}
                className="block font-serif text-sm text-foreground transition-colors hover:text-gold"
              >
                {name}
                {d.qualifier && <span className="text-muted">{" · "}{d.qualifier}</span>}
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

              <p className="mt-2 text-sm">
                <span className="font-medium text-gold-soft">{d.pctUnder}% below median</span>
                <span className="text-muted"> · median {formatPrice(d.medianPrice, d.currency)}</span>
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
        className="mt-8 block rounded-full border border-border px-5 py-3 text-center text-sm font-medium text-gold transition-colors hover:border-gold hover:text-gold-soft"
      >
        See all today&rsquo;s deals
      </Link>
    </section>
  );
}
