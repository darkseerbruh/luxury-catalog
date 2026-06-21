import Link from "next/link";
import { getBrandsOverview, getHeroCarousel } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getCloset } from "@/lib/collections";
import { getFeed } from "@/lib/feed";
import { FeedItem } from "@/components/FeedItem";
import Recommendations from "@/components/Recommendations";
import PersonaRouter from "@/components/PersonaRouter";

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

  const liveBrands = brands.filter((b) => b.isLive);
  const comingSoonBrands = brands.filter((b) => !b.isLive);

  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-border px-5 py-16 text-center">
        <h1 className="mx-auto max-w-xl font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          The Luxury Catalog knows style.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          The definitive reference for designer handbags — production
          history, authentication markers, and resale intelligence in one
          place.
        </p>
        <form
          action="/search"
          method="GET"
          className="mx-auto mt-8 flex max-w-md items-center gap-2"
        >
          <input
            name="q"
            type="search"
            placeholder="Search a brand or style…"
            className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
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

      {heroCards.length > 0 && (
        <section className="border-b border-border px-5 py-12">
          <h2 className="font-serif text-2xl text-foreground">
            It bags of all time
          </h2>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {heroCards.map((card) => (
              <Link
                key={card.styleId}
                href={`/search?q=${encodeURIComponent(card.styleName)}`}
                className="min-w-[220px] flex-shrink-0 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold"
              >
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
              Save bags you want or have and track their prices.
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
              Your closet is empty. Use <span className="text-gold">Save this bag</span> on
              any bag to add it here.
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
                  className="min-w-[200px] flex-shrink-0 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold"
                >
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
          <Recommendations source="home" layout="scroll" limit={8} />
        </section>
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
              ? [{ href: "/watchlist", label: "Your watchlist" }]
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
