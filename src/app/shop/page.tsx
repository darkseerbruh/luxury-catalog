import Link from "next/link";
import { getShopProducts, type ShopProduct, type ShopSort } from "@/lib/listings";
import { getVariantImages, getStyleHeroImages } from "@/lib/queries";
import { getStyleRanks } from "@/lib/lc-index";
import { BagImage } from "@/components/BagImage";
import IndexRankLink from "@/components/IndexRankLink";
import { CompareToggle, CompareTray } from "@/components/CompareControls";
import ShopControls from "./ShopControls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop the market · Luxury Catalog",
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
    min?: string;
    max?: string;
    color?: string;
    material?: string;
    hardware?: string;
    condition?: string;
    feet?: string;
  }>;
}) {
  const {
    brand = "",
    sort = "best-deal",
    deals = "",
    min = "",
    max = "",
    color = "",
    material = "",
    hardware = "",
    condition = "",
    feet = "",
  } = await searchParams;
  const protectiveFeet = feet === "yes" || feet === "unknown" ? feet : undefined;
  const sortValue = (VALID_SORTS as string[]).includes(sort) ? (sort as ShopSort) : "best-deal";
  const minPrice = min && Number.isFinite(Number(min)) ? Number(min) : undefined;
  const maxPrice = max && Number.isFinite(Number(max)) ? Number(max) : undefined;

  const result = await getShopProducts({
    brand: brand || undefined,
    sort: sortValue,
    dealsOnly: deals === "1",
    minPrice,
    maxPrice,
    color: color || undefined,
    material: material || undefined,
    hardware: hardware || undefined,
    condition: condition || undefined,
    protectiveFeet,
  });

  // Tile photos, three reaches: the cheapest listing's variant, then the group's
  // other listed variants, then ANY catalog photo on the style — so a photo-less
  // cheapest listing (e.g. an eBay-only seller; only TLC writes listing_image)
  // can't blank a tile whose siblings have photos.
  const images = await getVariantImages(result.products.flatMap((p) => p.imageVariantIds));
  const tileImage = new Map<string, string>();
  for (const p of result.products) {
    const hit = p.imageVariantIds.map((v) => images[v]).find(Boolean);
    if (hit) tileImage.set(p.key, hit);
  }
  const uncovered = result.products.filter((p) => !tileImage.has(p.key));
  if (uncovered.length > 0) {
    const styleHeros = await getStyleHeroImages(uncovered.map((p) => p.styleId));
    for (const p of uncovered) {
      const url = styleHeros[p.styleId];
      if (url) tileImage.set(p.key, url);
    }
  }

  // LC Index rank per style (Concept C). Empty when the index is unavailable, so
  // the inline link simply does not render.
  const ranks = await getStyleRanks(result.products.map((p) => p.styleId));

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
        current={{ brand, sort: sortValue, deals: deals === "1", min, max, color, material, hardware, condition, feet }}
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
              const imageUrl = tileImage.get(p.key) ?? null;
              // NO deal chip on these tiles (owner ruled 2026-07-08): a tile fronts
              // a whole style at a size (dozens of variants; the photo and from-price
              // are category-representative, not an item for sale), so a price verdict
              // here overclaims however it's computed. Deal verdicts live at LISTING
              // level: the bag page's for-sale rail and the homepage Best deals row.
              // p.dealBand still drives the deals-only filter + best-deal sort.
              return (
                <li key={p.key} className="group relative">
                  {/* Stretched-link card: the bag Link fills the tile (z-0), the
                      content sits above it but passes clicks through (pointer-events-
                      none), and the two real interactive bits — CompareToggle and the
                      Index rank link — opt back in with pointer-events-auto. This keeps
                      the rank a genuine sibling link, never an anchor nested in an
                      anchor. */}
                  <CompareToggle
                    variantId={p.variantId}
                    label={bagLabel(p)}
                    compact
                    className="absolute right-2 top-2 z-20"
                  />
                  <Link
                    href={`/bag/${p.variantId}#for-sale`}
                    aria-label={bagLabel(p)}
                    className="absolute inset-0 z-0 rounded-2xl"
                  />
                  <div className="pointer-events-none flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors group-hover:border-gold">
                    <div className="relative">
                      <BagImage
                        imageUrl={imageUrl}
                        brand={p.brandName}
                        alt={imageUrl ? bagLabel(p) : undefined}
                        className="aspect-square w-full"
                      />
                    </div>
                    <div className="flex flex-1 flex-col px-3 py-3">
                      <p className="font-serif text-foreground">{bagLabel(p)}</p>
                      {ranks[p.styleId] != null && (
                        <IndexRankLink
                          rank={ranks[p.styleId]}
                          className="pointer-events-auto relative z-10 mt-0.5 text-xs"
                        />
                      )}
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
                  </div>
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
      <CompareTray />
    </main>
  );
}
