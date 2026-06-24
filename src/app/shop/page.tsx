import Link from "next/link";
import { getShopProducts, type ShopProduct, type ShopSort } from "@/lib/listings";
import { getVariantImages } from "@/lib/queries";
import { BagImage } from "@/components/BagImage";
import ShopControls from "./ShopControls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop the market · The Luxury Catalog",
  description:
    "Compare live resale prices for designer bags across every marketplace we track, each rated against the fair value for its spec. We don't sell these — we find the best offer and link you to the seller.",
};

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

function bagLabel(p: ShopProduct): string {
  return [p.brandName, p.styleName].filter(Boolean).join(" ") || "A catalogued bag";
}

function subLabel(p: ShopProduct): string {
  const colors = p.colorCount > 0 ? `${p.colorCount} ${p.colorCount === 1 ? "color" : "colors"}` : null;
  return [p.sizeLabel, colors].filter(Boolean).join(" · ");
}

const VALID_SORTS: ShopSort[] = ["best-deal", "price-asc", "price-desc", "newest"];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    brand?: string;
    sort?: string;
    deals?: string;
    max?: string;
    color?: string;
    material?: string;
    hardware?: string;
    condition?: string;
  }>;
}) {
  const {
    brand = "",
    sort = "best-deal",
    deals = "",
    max = "",
    color = "",
    material = "",
    hardware = "",
    condition = "",
  } = await searchParams;
  const sortValue = (VALID_SORTS as string[]).includes(sort) ? (sort as ShopSort) : "best-deal";
  const maxPrice = max && Number.isFinite(Number(max)) ? Number(max) : undefined;

  const result = await getShopProducts({
    brand: brand || undefined,
    sort: sortValue,
    dealsOnly: deals === "1",
    maxPrice,
    color: color || undefined,
    material: material || undefined,
    hardware: hardware || undefined,
    condition: condition || undefined,
  });

  const images = await getVariantImages(result.products.map((p) => p.variantId));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Shop the market</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">
          Compare live prices across every marketplace
        </h1>
        <p className="mt-3 max-w-prose text-muted">
          Real resale listings we&rsquo;ve recorded, each rated against the fair value for
          its spec. We don&rsquo;t sell these, we find the best offer and send you to the
          seller.
        </p>
      </header>

      <ShopControls
        facets={result.facets}
        current={{ brand, sort: sortValue, deals: deals === "1", max, color, material, hardware, condition }}
      />

      {result.products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-12 text-center text-muted">
          No listings match right now. Try clearing a filter, or check back soon as we
          record more of the market.
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">
            {result.totalProducts.toLocaleString()} bags · {result.totalListings.toLocaleString()}{" "}
            listings
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {result.products.map((p) => {
              const imageUrl = images[p.variantId] ?? null;
              const pulse =
                p.bestBand === "great"
                  ? "Great deal in stock"
                  : p.bestBand === "good"
                    ? "Good deal in stock"
                    : null;
              return (
                <li key={p.key}>
                  <Link
                    href={`/bag/${p.variantId}#for-sale`}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-gold"
                  >
                    <div className="relative">
                      <BagImage
                        imageUrl={imageUrl}
                        brand={p.brandName}
                        alt={imageUrl ? bagLabel(p) : undefined}
                        className="aspect-square w-full"
                      />
                      {pulse && (
                        <span className="absolute left-2 top-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                          {pulse}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col px-3 py-3">
                      <p className="truncate font-serif text-foreground">{bagLabel(p)}</p>
                      {subLabel(p) && (
                        <p className="truncate text-xs text-muted">{subLabel(p)}</p>
                      )}
                      <p className="mt-2 text-sm font-medium text-foreground">
                        from {formatPrice(p.fromPrice, p.currency)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {p.listingCount} {p.listingCount === 1 ? "listing" : "listings"} ·{" "}
                        {p.sellerCount} {p.sellerCount === 1 ? "seller" : "sellers"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="max-w-prose text-xs text-muted/70">
        &ldquo;From&rdquo; is the lowest current listing. Open a bag to compare every offer,
        each rated against the fair value for its exact spec. Prices change and sell, so a
        listing here may already be gone. Estimates from recorded resale data, not
        appraisals. Affiliate links may earn us a commission.
      </p>
    </main>
  );
}
