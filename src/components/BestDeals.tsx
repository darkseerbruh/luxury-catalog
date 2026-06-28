import Link from "next/link";
import { getDeals } from "@/lib/deals";
import { getVariantImages } from "@/lib/queries";
import { BagImage } from "@/components/BagImage";
import { QuickSaveHeart } from "@/components/QuickSaveHeart";

/**
 * "Best deals right now" — its own homepage section (not a single goal tile).
 * Deals deserve a row, not one bag: this shows several current listings priced
 * under their resale median, ranked by the biggest gap.
 *
 * Every figure is a recorded value (current listing vs. recorded median) — never
 * fabricated. Resilient by contract: getDeals returns [] on any missing env /
 * column / query error, and this section renders nothing when there are no deals,
 * so a credential-less or pre-0021 environment simply omits it.
 */

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export default async function BestDeals() {
  const deals = await getDeals(8);
  if (deals.length === 0) return null;

  const images = await getVariantImages(deals.map((d) => d.variantId));

  return (
    <section className="border-b border-border px-5 py-12">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Best deals right now</h2>
          <p className="mt-1 text-sm text-muted">
            Current listings priced under their resale median, biggest gap first.
          </p>
        </div>
        <Link
          href="/shop?deals=1&sort=best-deal"
          className="flex-shrink-0 text-sm text-muted transition-colors hover:text-gold"
        >
          See all deals
        </Link>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {deals.map((d) => {
          const name = [d.brandName, d.styleName].filter(Boolean).join(" ");
          return (
            <div key={d.variantId} className="relative min-w-[200px] max-w-[220px] flex-shrink-0">
              <QuickSaveHeart variantId={d.variantId} source="deals" className="absolute left-2 top-2 z-10" />
              <Link
                href={`/bag/${d.variantId}`}
                className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold"
              >
                <div className="relative">
                  <BagImage
                    imageUrl={images[d.variantId]}
                    brand={d.brandName}
                    className="mb-3 aspect-square w-full rounded-xl"
                  />
                  <span className="absolute right-2 top-2 rounded-full border border-gold/40 bg-bg/90 px-2.5 py-0.5 text-xs font-medium text-gold-soft">
                    {d.pctUnder}% under
                  </span>
                </div>
                <p className="truncate font-serif text-lg text-foreground">{name}</p>
                {d.sizeLabel && <p className="mt-0.5 text-sm text-muted">{d.sizeLabel}</p>}
                <p className="mt-2 text-sm">
                  <span className="text-foreground">{formatPrice(d.currentPrice, d.currency)}</span>
                  <span className="text-muted"> vs. {formatPrice(d.medianPrice, d.currency)} median</span>
                </p>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
