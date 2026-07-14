import type { Metadata } from "next";
import Link from "next/link";
import {
  CARE_GROUPS,
  careItemsByGroup,
  CARE_ITEMS,
} from "@/lib/bag-care";
import CareOutboundLink from "@/components/care/CareOutboundLink";
import { careItemImageUrl } from "@/lib/affiliate";

export const metadata: Metadata = {
  title: "How to care for a designer bag, and the shelf that helps",
  description:
    "A curated care shelf for the bag you already own: how to shape, store, clean, condition, and protect it, by material, with the products we'd reach for and the mistakes to avoid.",
};

export const revalidate = 3600;

export default function CarePage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "The care shelf for designer bags",
    description:
      "Curated bag-care products by job: shape and store, clean and condition, hardware, display, and travel.",
    numberOfItems: CARE_ITEMS.length,
    itemListElement: CARE_ITEMS.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <header className="mb-6">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gold">Care your bag</p>
        <h1 className="font-serif text-3xl text-foreground">The care shelf</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          You found it, you bought it, now it&apos;s yours to keep. A good bag rewards a
          little upkeep, and loses value when it goes without.
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          This is the small shelf we&apos;d keep beside a collection: what shapes it, cleans
          it, and protects it, grouped by the job it does.
        </p>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted/80">
          Our picks are a starting point. Leather is unforgiving, so test anything new on a
          hidden spot first, and go gentle.
        </p>
      </header>

      {/* Quick jump — a light nav so the page never reads as one long scroll. */}
      <nav className="mb-8 flex flex-wrap gap-2">
        {CARE_GROUPS.map((g) => (
          <a
            key={g.key}
            href={`#${g.key}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold hover:text-foreground"
          >
            <span aria-hidden>{g.icon}</span>
            {g.title}
          </a>
        ))}
      </nav>

      {CARE_GROUPS.map((group) => (
        <section key={group.key} id={group.key} className="mb-10 scroll-mt-4">
          <h2 className="flex items-center gap-2 font-serif text-xl text-foreground">
            <span aria-hidden className="text-lg">{group.icon}</span>
            {group.title}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{group.blurb}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {careItemsByGroup(group.key).map((item) => {
              // Real Amazon product photo, once PA-API is live; null today, so the
              // slot renders nothing and the card stays clean text (see affiliate.ts).
              const imageUrl = careItemImageUrl(item.searchQuery);
              return (
              <div
                key={item.key}
                className="flex flex-col rounded-xl border border-border p-4 transition-colors hover:border-gold"
              >
                {imageUrl && (
                  <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-foreground/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-contain" />
                  </div>
                )}
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{item.whatItDoes}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  <span className="text-foreground/80">What I&apos;d look at:</span> {item.lookFor}
                </p>
                {item.watchOut && (
                  <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-muted/80">
                    <span aria-hidden>⚠️</span>
                    <span>{item.watchOut}</span>
                  </p>
                )}
                <CareOutboundLink
                  query={item.searchQuery}
                  item={item.key}
                  className="mt-3 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
                >
                  Find on Amazon &rarr;
                </CareOutboundLink>
              </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Cross-links: the shelf is the OWN state; route to the other states. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-foreground">Thinking of adding one?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Where to buy, honestly: what protects you as a buyer at each resale venue.
          </p>
          <Link
            href="/where-to-buy"
            className="mt-2 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
          >
            Where to buy &rarr;
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-foreground">Ready to let one go?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Where to sell, and what you&apos;d actually keep at each venue after fees.
          </p>
          <Link
            href="/where-to-sell"
            className="mt-2 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
          >
            Where to sell &rarr;
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted/70">
        Some Amazon links are affiliate links: if you buy through one we may earn a small
        commission, at no extra cost to you. It never changes what we&apos;d recommend. See our{" "}
        <Link href="/disclosure" className="underline underline-offset-2 hover:text-gold">
          affiliate disclosure
        </Link>
        .
      </p>
    </main>
  );
}
