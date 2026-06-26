import Link from "next/link";
import { BRAND_TIERS, getBrandsOverview, getHeroCarousel, getVariantImages } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getCloset } from "@/lib/collections";
import { getFeed } from "@/lib/feed";
import { FeedItem } from "@/components/FeedItem";
import PersonaRouter from "@/components/PersonaRouter";
import BestDeals from "@/components/BestDeals";
import CommunityLeaderboards from "@/components/CommunityLeaderboards";
import { BagImage } from "@/components/BagImage";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { communityKnowledgeReady } from "@/lib/content-gates";

export const dynamic = "force-dynamic";

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export default async function Home() {
  const [brands, heroCards, user, communityReady] = await Promise.all([
    getBrandsOverview(),
    getHeroCarousel(),
    getCurrentUser(),
    communityKnowledgeReady(),
  ]);
  const [closet, feed] = user
    ? await Promise.all([getCloset(), getFeed(8)])
    : [[], []];

  // Real photos for the hero + closet cards when available; placeholders otherwise.
  const images = await getVariantImages([
    ...heroCards.map((c) => c.variantId),
    ...closet.map((c) => c.variantId),
  ].filter((n): n is number => n != null));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
      <section className="border-b border-border px-5 py-10 text-center">
        <h1 className="mx-auto max-w-2xl font-serif text-3xl leading-tight text-foreground sm:text-4xl">
          Look up any designer bag: real prices, authentication, and history.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          One reference for what&rsquo;s real, what it&rsquo;s worth, and where to
          buy it smart.
        </p>
        <form
          action="/search"
          method="GET"
          className="mx-auto mt-6 flex max-w-md items-center gap-2"
        >
          <input
            name="q"
            type="search"
            placeholder="Look up any bag: prices, authentication, history"
            className="min-w-0 flex-1 truncate rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Search
          </button>
        </form>
      </section>

      {!user && (
        <section className="border-b border-border bg-gold/5 px-5 py-12 text-center">
          <p className="text-sm uppercase tracking-widest text-gold">Find your taste</p>
          <h2 className="mx-auto mt-2 max-w-xl font-serif text-2xl text-foreground sm:text-3xl">
            Discover your handbag taste in 60 seconds
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            A few quick taps and we&rsquo;ll name your taste and match you to bags
            you&rsquo;ll love. <span className="text-foreground">No account needed</span> to
            see your result.
          </p>
          <Link
            href="/quiz"
            className="mt-6 inline-block rounded-full bg-gold px-6 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Take the taste quiz →
          </Link>
        </section>
      )}

      <PersonaRouter />

      <BestDeals />

      {/* "What the community knows" — gated until there are enough real reviews
          to fill the boards (docs/ux/content-gating-strategy.md). No ghost town. */}
      {communityReady && <CommunityLeaderboards />}

      {heroCards.length > 0 && (
        <section className="border-b border-border px-5 py-12">
          <h2 className="font-serif text-2xl text-foreground">
            It bags of all time
          </h2>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {heroCards.map((card) => (
              <Link
                key={card.styleId}
                href={card.variantId ? `/bag/${card.variantId}` : `/search?q=${encodeURIComponent(card.styleName)}`}
                className="min-w-[220px] max-w-[240px] flex-shrink-0 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold"
              >
                <BagImage
                  imageUrl={card.variantId != null ? images[card.variantId] : null}
                  brand={card.brandName}
                  className="mb-3 aspect-[4/3] w-full rounded-xl"
                />
                <p className="text-sm uppercase tracking-wide text-muted">
                  {card.brandName}
                </p>
                <p className="mt-1 font-serif text-lg text-foreground">
                  {card.styleName}
                </p>
                {card.sizeLabel && (
                  <p className="mt-2 text-sm text-muted">{card.sizeLabel}</p>
                )}
                {formatPrice(card.priceFrom, card.currency) && (
                  <p className="mt-3 text-sm text-gold">
                    From {formatPrice(card.priceFrom, card.currency)} retail
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {user && feed.length > 0 && (
        <section className="border-b border-border px-5 py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl text-foreground">Activity</h2>
            <Link href="/feed" className="text-sm text-muted transition-colors hover:text-gold">
              View all
            </Link>
          </div>
          <ul className="mt-6 flex flex-col gap-2.5">
            {feed.map((e) => (
              <FeedItem key={e.id} event={e} />
            ))}
          </ul>
        </section>
      )}

      <section className="border-b border-border px-5 py-12">
        {!user ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
            <h2 className="font-serif text-2xl text-foreground">Your closet</h2>
            <p className="mx-auto mt-2 max-w-sm text-muted">
              Keep the bags you own and the ones you&rsquo;re after in one
              place, and watch what they&rsquo;re worth.
            </p>
            <Link
              href="/signup"
              className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
            >
              Create a free account
            </Link>
          </div>
        ) : closet.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
            <h2 className="font-serif text-2xl text-foreground">Your closet</h2>
            <p className="mx-auto mt-2 max-w-sm text-muted">
              Nothing here yet. Hit <span className="text-gold">Save this bag</span> on
              any bag and it lands in your closet.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-2xl text-foreground">Your closet</h2>
              <Link href="/closet" className="text-sm text-muted transition-colors hover:text-gold">
                View all ({closet.length})
              </Link>
            </div>
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
              {closet.slice(0, 8).map((c) => (
                <Link
                  key={c.variantId}
                  href={`/bag/${c.variantId}`}
                  className="min-w-[200px] max-w-[220px] flex-shrink-0 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold"
                >
                  <BagImage imageUrl={images[c.variantId]} brand={c.brandName} className="mb-3 aspect-square w-full rounded-xl" />
                  <p className="text-sm uppercase tracking-wide text-muted">{c.brandName}</p>
                  <p className="mt-1 font-serif text-lg text-foreground">{c.styleName}</p>
                  <p className="mt-2 text-sm text-muted">{c.label}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <section id="brands" className="border-b border-border px-5 py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl text-foreground">Bags by brand</h2>
          <Link
            href="/brands"
            className="text-sm text-muted transition-colors hover:text-gold"
          >
            All brands
          </Link>
        </div>
        <div className="mt-8 flex flex-col gap-10">
          {BRAND_TIERS.map((tier) => {
            const group = brands.filter((b) => b.tier === tier.key);
            if (group.length === 0) return null;
            return (
              <div key={tier.key}>
                <p className="text-xs uppercase tracking-widest text-muted/70">
                  {tier.label}
                </p>
                <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((brand) => (
                    <div key={brand.brandId}>
                      <Link
                        href={`/brand/${brand.brandId}`}
                        className="font-serif text-lg text-foreground transition-colors hover:text-gold"
                      >
                        {brand.name}
                      </Link>
                      {brand.isLive ? (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {brand.topStyles.map((s) => (
                            <li key={s.styleId}>
                              <Link
                                href={
                                  s.variantId
                                    ? `/bag/${s.variantId}`
                                    : `/brand/${brand.brandId}`
                                }
                                className="text-sm text-muted transition-colors hover:text-gold"
                              >
                                {s.name}
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              href={`/brand/${brand.brandId}`}
                              className="text-sm text-gold transition-colors hover:text-gold-soft"
                            >
                              View all {brand.name} →
                            </Link>
                          </li>
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted/60">
                          Coming soon
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stay in the loop — last on the page, full width, one compact line. */}
      <section className="px-5 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Stay in the loop</h2>
            <p className="mt-1 text-sm text-muted">
              New brands, price drops, and authentication guides. A few times a
              month, never spam.
            </p>
          </div>
          <NewsletterSignup source="homepage" className="w-full sm:w-auto sm:min-w-[22rem]" />
        </div>
      </section>
    </main>
  );
}
