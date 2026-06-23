import Link from "next/link";
import { getBrandsOverview, getHeroCarousel, getVariantImages } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getCloset } from "@/lib/collections";
import { getFeed } from "@/lib/feed";
import { FeedItem } from "@/components/FeedItem";
import Recommendations from "@/components/Recommendations";
import PersonalizedRecs from "@/components/PersonalizedRecs";
import PersonaRouter from "@/components/PersonaRouter";
import CommunityLeaderboards from "@/components/CommunityLeaderboards";
import { BagImage } from "@/components/BagImage";
import { PostHogFlagBootstrap } from "@/components/PostHogFlagBootstrap";
import { ExperimentExposure } from "@/components/ExperimentExposure";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getUserProfile } from "@/lib/personalization/user-profile";
import { evaluatePersonalizationFlag, getBootstrapFlags } from "@/lib/analytics/flags";

export const dynamic = "force-dynamic";

const FITS: { label: string; slug: string }[] = [
  { label: "Cell phone", slug: "cell-phone" },
  { label: "Tablet or book", slug: "tablet" },
  { label: "Laptop & more", slug: "laptop" },
];

const CARRY_METHODS: { label: string; slug: string }[] = [
  { label: "Shoulder", slug: "shoulder" },
  { label: "Top handle", slug: "top-handle" },
  { label: "Crossbody", slug: "crossbody" },
  { label: "Backpack", slug: "backpack" },
  { label: "Belt bag", slug: "belt-bag" },
  { label: "Wallets, pouches & clutches", slug: "clutch" },
  { label: "Rolling luggage", slug: "luggage" },
];

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export default async function Home() {
  const [brands, heroCards, user] = await Promise.all([
    getBrandsOverview(),
    getHeroCarousel(),
    getCurrentUser(),
  ]);
  const [closet, feed] = user
    ? await Promise.all([getCloset(), getFeed(8)])
    : [[], []];

  // Phase-2 personalization: evaluate the PostHog flag server-side so the
  // decision is baked into the initial HTML (no flicker). Bootstrap the
  // evaluated values to the client so PostHog JS stays in sync for event tracking.
  let showPersonalized = false;
  let bootstrapFlags: Record<string, string | boolean> = {};
  if (user) {
    const personProfile = await getUserProfile(user.id);
    const personProps = {
      persona: personProfile?.persona ?? null,
      budget_band: personProfile?.budgetBand ?? null,
      intent: personProfile?.intent ?? null,
    };
    const [flagValue, flagBootstrap] = await Promise.all([
      evaluatePersonalizationFlag(user.id, personProps),
      getBootstrapFlags(user.id, personProps),
    ]);
    showPersonalized = flagValue === true || flagValue === "test";
    bootstrapFlags = flagBootstrap?.flags ?? {};
  }

  const liveBrands = brands.filter((b) => b.isLive);
  const comingSoonBrands = brands.filter((b) => !b.isLive);

  // Real photos for the hero + closet cards when available; placeholders otherwise.
  const images = await getVariantImages([
    ...heroCards.map((c) => c.variantId),
    ...closet.map((c) => c.variantId),
  ].filter((n): n is number => n != null));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
      <section className="border-b border-border px-5 py-10 text-center">
        <h1 className="mx-auto max-w-2xl font-serif text-3xl leading-tight text-foreground sm:text-4xl">
          Know what it&rsquo;s worth — and what it&rsquo;s worth <em>to you</em>.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          The reference for designer handbags: production history, authentication
          markers, and real resale prices, all in one place.
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
            you&rsquo;ll love — <span className="text-foreground">no account needed</span> to
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

      <CommunityLeaderboards />

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

      {user && (
        <section className="border-b border-border px-5 py-12">
          {showPersonalized ? (
            <PersonalizedRecs
              userId={user.id}
              source="home_personalized"
              layout="scroll"
              limit={8}
            />
          ) : (
            <Recommendations source="home" layout="scroll" limit={8} />
          )}
        </section>
      )}

      {/* Bootstrap PostHog flag state from the server to the client to prevent
          flag-evaluation flicker and to track experiment exposure correctly. */}
      {user && Object.keys(bootstrapFlags).length > 0 && (
        <PostHogFlagBootstrap flags={bootstrapFlags} />
      )}
      {user && (
        <ExperimentExposure
          flag="personalized_home"
          variant={showPersonalized ? "test" : "control"}
        />
      )}

      <section className="border-b border-border px-5 py-12">
        <h2 className="font-serif text-2xl text-foreground">Explore</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { href: "/quiz", label: "Find your taste" },
            { href: "/identify", label: "Identify a bag" },
            { href: "/closets", label: "Most coveted closets" },
            { href: "/posts", label: "Expert articles" },
            ...(user
              ? [
                  { href: "/watchlist", label: "Your watchlist" },
                  { href: "/taste", label: "Your taste profile" },
                ]
              : []),
            { href: "/found", label: "Log a thrift find" },
          ].map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-b border-border px-5 py-12">
        <h2 className="font-serif text-2xl text-foreground">Stay in the loop</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          New brands, price drops, and authentication guides — a few times a month,
          never spam.
        </p>
        <NewsletterSignup source="homepage" className="mt-6 max-w-md" />
      </section>

      <section id="brands" className="border-b border-border px-5 py-12">
        <h2 className="font-serif text-2xl text-foreground">Bags by brand</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {liveBrands.map((brand) => (
            <Link
              key={brand.brandId}
              href={`/brand/${brand.brandId}`}
              className="rounded-xl border border-border bg-surface px-4 py-4 text-foreground transition-colors hover:border-gold"
            >
              {brand.name}
            </Link>
          ))}
          {comingSoonBrands.map((brand) => (
            <div
              key={brand.brandId}
              className="rounded-xl border border-border bg-surface/40 px-4 py-4 text-muted"
            >
              <p>{brand.name}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted/70">
                Coming soon
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="fits" className="border-b border-border px-5 py-12">
        <h2 className="font-serif text-2xl text-foreground">
          Bags by what they fit
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FITS.map((fit) => (
            <Link
              key={fit.slug}
              href={`/browse/fits/${fit.slug}`}
              className="rounded-xl border border-border bg-surface px-4 py-4 text-foreground transition-colors hover:border-gold"
            >
              {fit.label}
            </Link>
          ))}
        </div>
      </section>

      <section id="carry" className="px-5 py-12">
        <h2 className="font-serif text-2xl text-foreground">
          Bags by how they&rsquo;re carried
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARRY_METHODS.map((method) => (
            <Link
              key={method.slug}
              href={`/browse/carry/${method.slug}`}
              className="rounded-xl border border-border bg-surface px-4 py-4 text-foreground transition-colors hover:border-gold"
            >
              {method.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
