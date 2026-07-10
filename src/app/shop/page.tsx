import Link from "next/link";
import Form from "next/form";
import { getShopProducts, type ShopProduct, type ShopSort } from "@/lib/listings";
import { getVariantImages, getStyleHeroImages } from "@/lib/queries";
import { getStyleRanks } from "@/lib/lc-index";
import { getCurrentUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/personalization/user-profile";
import { resolveMarketSearch } from "@/lib/market-search";
import { matchSocialKey } from "@/lib/social-search-keys";
import { listPublished, getBySlug } from "@/lib/posts";
import { BagImage } from "@/components/BagImage";
import IndexRankLink from "@/components/IndexRankLink";
import { CompareToggle, CompareTray } from "@/components/CompareControls";
import ShopControls from "./ShopControls";
import SearchTracker from "../search/SearchTracker";
import RequestBagForm from "../search/RequestBagForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop the market · Luxury Catalog",
  description:
    "Search every designer bag and compare live resale prices across the marketplaces we track, each rated against the fair value for its spec. We don't sell these — we find the best offer and link you to the seller.",
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
    q?: string;
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
    q = "",
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
  const query = q.trim();
  const protectiveFeet = feet === "yes" || feet === "unknown" ? feet : undefined;
  const sortValue = (VALID_SORTS as string[]).includes(sort) ? (sort as ShopSort) : "best-deal";
  const minPrice = min && Number.isFinite(Number(min)) ? Number(min) : undefined;
  const maxPrice = max && Number.isFinite(Number(max)) ? Number(max) : undefined;

  // Text search narrows the market to the matched styles, using the same engine /search
  // uses (one search brain). Profile powers the taste rerank when signed in + Voyage is set.
  const user = query ? await getCurrentUser() : null;
  const profile = user ? await getUserProfile(user.id) : null;
  const search = query ? await resolveMarketSearch(query, profile) : null;

  const result = await getShopProducts({
    styleIds: search ? search.styleIds : undefined,
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

  // Matched styles with NO live listing right now: still findable, in a labeled strip
  // below the grid (the StockX "no asks" model), so a search never dead-ends on a real bag.
  const shownStyleIds = new Set(result.products.map((p) => p.styleId));
  const unlisted = search
    ? search.styles.filter((s) => !shownStyleIds.has(s.styleId) && s.variants[0]).slice(0, 12)
    : [];

  // Unified search also spans our writing: match published articles by title/excerpt,
  // and pin a spoken video-CTA key ("search chanel 2026 on luxurycatalog.com") when it hits.
  const ql = query.toLowerCase();
  const articleHits = query
    ? (await listPublished())
        .filter((p) => p.title.toLowerCase().includes(ql) || (p.excerpt ?? "").toLowerCase().includes(ql))
        .slice(0, 6)
    : [];
  const socialHit = query ? matchSocialKey(query) : null;
  const pinnedPost = socialHit ? await getBySlug(socialHit.slug) : null;
  const pinned = pinnedPost?.status === "published" ? pinnedPost : null;
  const articleHitsFiltered = articleHits.filter((p) => p.slug !== pinned?.slug);

  const nothingForQuery =
    query &&
    result.products.length === 0 &&
    unlisted.length === 0 &&
    articleHitsFiltered.length === 0 &&
    !pinned;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10">
      {query && (
        <SearchTracker
          query={query}
          resultCount={result.totalProducts + unlisted.length}
          socialKey={pinned ? socialHit?.key : undefined}
        />
      )}

      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Shop the market</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">
          Search and compare live prices, everywhere we look
        </h1>
        <p className="mt-3 max-w-prose text-muted">
          Every bag we track, with real resale listings rated against the fair value for its
          spec. Type what you want or filter your way in. We don&rsquo;t sell these, we find
          the best offer and send you to the seller.
        </p>
      </header>

      {/* One box, one grid: search is the text, browse is the filters below, deals is a
          toggle. next/form → client navigation so /shop/loading.tsx shows on submit.
          min-w-0 + shrink-0 keep the row inside the mobile viewport. */}
      <Form action="/shop" className="flex w-full items-center gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search — a brand, a style, or “structured black crossbody under $2,000”"
          className="min-w-0 flex-1 truncate rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Search
        </button>
      </Form>

      {query && search && search.usedNaturalLanguage && search.interpreted.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Interpreted as:</span>
          {search.interpreted.map((part) => (
            <span key={part} className="rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-gold/90">
              {part}
            </span>
          ))}
        </div>
      )}

      {/* Rail owns the layout: filters live in a left sidebar (desktop) / bottom
          tray (mobile), and the server-rendered results pass through as children
          into the right column. One place for every control, results stay server-side. */}
      <ShopControls
        facets={result.facets}
        current={{ brand, sort: sortValue, deals: deals === "1", min, max, color, material, hardware, condition, feet }}
        resultCount={result.totalProducts}
        totalListings={result.totalListings}
        query={query}
      >
      {pinned && (
        <section>
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-gold">From our videos</p>
          <Link
            href={`/articles/${pinned.slug}`}
            className="group block rounded-lg border border-gold/50 bg-surface p-5 transition-colors hover:border-gold"
          >
            <h2 className="font-serif text-xl leading-tight text-foreground group-hover:text-gold-soft">
              {pinned.title}
            </h2>
            {pinned.excerpt && (
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{pinned.excerpt}</p>
            )}
            <p className="mt-3 text-xs text-gold">The full read &rarr;</p>
          </Link>
        </section>
      )}

      {nothingForQuery ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">Nothing for &ldquo;{query}&rdquo; yet.</p>
          <p className="mt-2 text-sm text-muted">
            We haven&rsquo;t researched this one yet. Ask for it and you bump it up the list, the
            most-requested bags get done first.
          </p>
          <RequestBagForm query={query} />
        </div>
      ) : result.products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-12 text-center text-muted">
          {query
            ? `No live listings for “${query}” right now.`
            : "No listings match right now. Try clearing a filter, or check back soon as we record more of the market."}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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

      {/* Matched bags with no live listing right now — still one tap from their page. */}
      {unlisted.length > 0 && (
        <section className="mt-2">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted/70">
            In the catalog, not listed for sale right now
          </p>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {unlisted.map((s) => (
              <Link
                key={s.styleId}
                href={`/bag/${s.variants[0]?.variantId}`}
                className="group flex items-baseline gap-2.5 border-b border-border/60 py-2.5"
              >
                <span className="shrink-0 text-gold">&rarr;</span>
                <span className="font-serif text-[15px] leading-snug text-foreground group-hover:text-gold-soft">
                  {[s.brandName, s.styleName].filter(Boolean).join(" ")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {articleHitsFiltered.length > 0 && (
        <section className="mt-2">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-gold">From articles</p>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {articleHitsFiltered.map((p) => (
              <Link
                key={p.postId}
                href={`/articles/${p.slug}`}
                className="group flex items-baseline gap-2.5 border-b border-border/60 py-2.5"
              >
                <span className="shrink-0 text-gold">&rarr;</span>
                <span className="font-serif text-[15px] leading-snug text-foreground group-hover:text-gold-soft">
                  {p.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      </ShopControls>

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
