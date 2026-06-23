import Link from "next/link";
import { getDeals, type Deal } from "@/lib/deals";
import { getVariantImages } from "@/lib/queries";
import { BagImage } from "@/components/BagImage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Today's deals · The Luxury Catalog",
  description:
    "Designer bags listed below their recorded resale median right now, ranked by how far under they sit. Prices are dated estimates from recorded resale data, not appraisals.",
};

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

function bagLabel(d: Deal): string {
  const name = [d.brandName, d.styleName].filter(Boolean).join(" ");
  return name || "A catalogued bag";
}

export default async function DealsPage() {
  const deals = await getDeals(24);
  const images = await getVariantImages(deals.map((d) => d.variantId));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Today&rsquo;s deals</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">
          Listed under the resale median
        </h1>
        <p className="mt-3 max-w-prose text-muted">
          Current listings sitting below what the bag usually resells for, biggest
          gap first. The median is the middle of every resale price we&rsquo;ve
          recorded for that exact variant, so &ldquo;under median&rdquo; means
          you&rsquo;re paying less than the typical buyer, not less than retail.
          Condition and inclusions move the real number, so read the listing before
          you decide.
        </p>
      </header>

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-12 text-center text-muted">
          No deals surfaced right now. Check back soon.
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {deals.map((d, i) => {
            const imageUrl = images[d.variantId] ?? null;
            const sub = [d.sizeLabel, d.platform].filter(Boolean).join(" · ");
            return (
              <li key={d.variantId}>
                <Link
                  href={`/bag/${d.variantId}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-4 transition-colors hover:border-gold"
                >
                  <span className="w-6 shrink-0 text-center font-serif text-lg text-gold">
                    {i + 1}
                  </span>
                  <BagImage
                    imageUrl={imageUrl}
                    brand={d.brandName}
                    alt={imageUrl ? bagLabel(d) : undefined}
                    className="h-16 w-16 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-foreground">{bagLabel(d)}</p>
                    {sub && <p className="truncate text-xs text-muted">{sub}</p>}
                    <p className="mt-1 text-sm">
                      <span className="text-foreground">{formatPrice(d.currentPrice, d.currency)}</span>
                      <span className="text-muted">
                        {" "}
                        vs. {formatPrice(d.medianPrice, d.currency)} median
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-gold/40 bg-gold-soft/10 px-3 py-1 text-center text-sm font-medium text-gold">
                    {d.pctUnder}% under
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      <p className="max-w-prose text-xs text-muted/70">
        Estimated from recorded resale prices, not an appraisal or a forecast.
        Listing prices change and sell, so a deal here may already be gone. Median
        figures reflect the resale data we&rsquo;ve recorded to date for each
        variant.
      </p>
    </main>
  );
}
