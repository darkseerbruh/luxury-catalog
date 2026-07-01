import Link from "next/link";
import { BRAND_TIERS, getBrandsOverview, getHeroCarousel } from "@/lib/queries";
import { getDeals, MIN_DEALS_TO_RENDER } from "@/lib/deals";
import PersonaRouter from "@/components/PersonaRouter";
import BestDeals from "@/components/BestDeals";
import CommunityLeaderboards from "@/components/CommunityLeaderboards";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import JournalShelf from "@/components/JournalShelf";
import { HomeHero } from "@/components/HomeHero";
import HomeStyleRead from "@/components/home/HomeStyleRead";
import HomeActivity from "@/components/home/HomeActivity";
import HomeCloset from "@/components/home/HomeCloset";
import { communityKnowledgeReady } from "@/lib/content-gates";
import { HOME_HEADLINE_DEFAULT, HOME_HEADLINE_COPY } from "@/lib/experiments/home-headline";

// Statically rendered (ISR): the homepage now reads only cookieless, cached
// catalog data, so Vercel serves it from the CDN edge instead of cold-booting a
// serverless function on every visit. Per-user content (style read, activity,
// closet) streams in client-side via the Home* islands. Revalidates on the same
// window as the catalog caches.
export const revalidate = 600;

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export default async function Home() {
  const [brands, heroCards, communityReady, deals] = await Promise.all([
    getBrandsOverview(),
    getHeroCarousel(),
    communityKnowledgeReady(),
    getDeals(5),
  ]);
  const hasDeals = deals.length >= MIN_DEALS_TO_RENDER;

  // home_headline / quiz_headline A/B tests are paused: pin the control arm so
  // the page can be statically cached (per-render Math.random would freeze one
  // arm into the cached HTML). Re-enable later as a client-side assignment.
  const headlineVariant = HOME_HEADLINE_DEFAULT;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
      <HomeHero variant={headlineVariant} headline={HOME_HEADLINE_COPY[headlineVariant]} />

      {/* What brings you in */}
      <PersonaRouter />

      {/* Style read — quiz callout when signed out, your saved read when signed in. */}
      <HomeStyleRead />

      {/* Mission band — honest about why the catalog needs contributions. The
          catalog runs on what owners share; this is the standing recruit. No
          figures here (content-gating rule: fallback visuals never assert a count). */}
      <section className="border-b border-border bg-surface/40 px-5 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Our mission</p>
          <h2 className="mt-2 font-serif text-2xl text-foreground sm:text-3xl">
            Luxury knowledge shouldn&apos;t be gatekept.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Resale values, real wear, what a bag is actually like to live with: the
            people who carry these bags know, and most of the web keeps it behind
            glass. We are opening it up. The catalog grows with every photo and
            review you add, so add the bags you own or want, and tell us what you know.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/browse"
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
            >
              Add to your closet
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              Review a bag you&apos;ve carried
            </Link>
          </div>
        </div>
      </section>

      {/* It bags of all time — full-width ranked canon. */}
      {heroCards.length > 0 && (
        <section className="border-b border-border px-5 py-12">
          <h2 className="font-serif text-2xl text-foreground">It bags of all time</h2>
          <p className="mt-1 text-sm text-muted">
            Our pick of the icons, and what each typically fetches on the resale market.
            Our read, not an appraisal.
          </p>
          <ol className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-3">
            {heroCards.map((card, i) => (
              <li key={card.styleId} className="flex gap-3.5">
                <span className="font-serif text-4xl leading-none text-gold-soft">{i + 1}</span>
                <Link
                  href={card.variantId ? `/bag/${card.variantId}` : `/search?q=${encodeURIComponent(card.styleName)}`}
                  className="group min-w-0 flex-1"
                >
                  <p className="text-xs uppercase tracking-wide text-muted">{card.brandName}</p>
                  <p className="font-serif text-xl text-foreground transition-colors group-hover:text-gold">
                    {card.styleName}
                  </p>
                  {card.medianResale != null && (
                    <>
                      <p
                        className="mt-1.5 font-serif text-xl text-gold-soft"
                        title={`Based on ${card.sampleSize.toLocaleString()} recorded resale prices`}
                      >
                        {formatPrice(card.medianResale, card.currency)}{" "}
                        <span className="text-xs font-normal text-muted">typical resale</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        low {formatPrice(card.lowResale, card.currency)} &middot; high{" "}
                        <span className="text-gold-soft">{formatPrice(card.highResale, card.currency)}</span>
                      </p>
                    </>
                  )}
                  <p className="mt-2 text-xs text-muted/80">{card.hook}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* From the Journal — renders nothing until at least one article is published. */}
      <JournalShelf />

      {/* Priced well today — full-width research section. */}
      {hasDeals && <BestDeals deals={deals} />}

      {/* Brands */}
      <section id="brands" className="border-b border-border px-5 py-12">
        <h2 className="font-serif text-2xl text-foreground">Brands</h2>
        <div className="mt-8 flex flex-col gap-10">
          {BRAND_TIERS.map((tier) => {
            const group = brands.filter((b) => b.tier === tier.key);
            if (group.length === 0) return null;
            return (
              <div key={tier.key}>
                <p className="text-xs uppercase tracking-widest text-muted/70">{tier.label}</p>
                <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-7 min-[360px]:grid-cols-2 sm:gap-x-8 lg:grid-cols-3">
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
                                href={s.variantId ? `/bag/${s.variantId}` : `/brand/${brand.brandId}`}
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
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted/60">Coming soon</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <Link
          href="/brands"
          className="mt-8 block rounded-full border border-border px-5 py-3 text-center text-sm font-medium text-gold transition-colors hover:border-gold hover:text-gold-soft"
        >
          All brands
        </Link>
      </section>

      {/* What the community knows — gated until enough real reviews fill the boards. */}
      {communityReady && <CommunityLeaderboards />}

      {/* Activity feed — signed-in only, streamed in client-side. */}
      <HomeActivity />

      {/* Your closet — account prompt when signed out, closet preview when signed in. */}
      <HomeCloset />

      {/* Sign up — stay in the loop, last on the page. */}
      <section className="px-5 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Stay in the loop</h2>
            <p className="mt-1 text-sm text-muted">
              New brands, price drops, and authentication guides. A few times a month, never spam.
            </p>
          </div>
          <NewsletterSignup source="homepage" className="w-full sm:w-auto sm:min-w-[22rem]" />
        </div>
      </section>
    </main>
  );
}
