import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandDetail, getBrandResaleStats, getVariantImages, getBrandsOverview } from "@/lib/queries";
import { listByBrand, listByStyle } from "@/lib/posts";
import { matchBagStory } from "@/lib/bag-stories";
import { buildResaleLinks, buildConsignmentLinks } from "@/lib/affiliate";
import { BagImage } from "@/components/BagImage";
import { ArticleList } from "@/components/ArticleList";
import { HouseStory } from "@/components/HouseStory";

export const dynamic = "force-dynamic";

function symbolFor(currency: string | null): string {
  return currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
}
function fmt(amount: number | null, currency: string | null): string | null {
  if (amount == null) return null;
  return `${symbolFor(currency)}${amount.toLocaleString()}`;
}

type BrandStyle = Awaited<ReturnType<typeof getBrandDetail>> extends infer B
  ? B extends { styles: infer S }
    ? S extends (infer One)[]
      ? One
      : never
    : never
  : never;

/** The lowest catalogued retail price across a style's variants ("from $X"). */
function styleFrom(style: BrandStyle): { amount: number; currency: string | null } | null {
  let best: { amount: number; currency: string | null } | null = null;
  for (const v of style.variants) {
    if (v.retailPrice == null) continue;
    if (best == null || v.retailPrice < best.amount) best = { amount: v.retailPrice, currency: v.currency };
  }
  return best;
}

/** Top-N most common non-null values, by frequency. */
function topN(values: (string | null)[], n: number): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, n);
}

function Chips({ items }: { items: { value: string; count: number }[] }) {
  if (items.length === 0) return <p className="text-sm text-muted/60">—</p>;
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i.value}
          className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
        >
          {i.value} <span className="text-muted/60">{i.count}</span>
        </span>
      ))}
    </div>
  );
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const id = parseInt(brandId, 10);
  if (isNaN(id)) notFound();

  const brand = await getBrandDetail(id);
  if (!brand) notFound();

  const liveStyles = brand.styles.filter((s) => s.variants.length > 0);
  const stubStyles = brand.styles.filter((s) => s.variants.length === 0);
  const allVariants = brand.styles.flatMap((s) => s.variants);

  // The icons — styles we hold a sourced editorial story for. A style with a
  // story is, by our own curation, one of the house's notable bags; the tagline
  // is the cited origin line. No story → not an icon (degrades, never invented).
  //
  // Many catalogue styles share one story fragment (e.g. "Togo Birkin 35" and
  // "2021 Epsom Birkin 30" both match "birkin"), so we keep ONE canonical
  // representative per story — the cleanest name (shortest), then the most
  // variants — dedupe by the story itself, then rank the icons by catalogue depth.
  const iconSeen = new Set<string>();
  const iconStyles = liveStyles
    .map((style) => ({ style, story: matchBagStory(style.name) }))
    .filter((x): x is { style: BrandStyle; story: NonNullable<typeof x.story> } => x.story != null)
    .sort(
      (a, b) =>
        a.style.name.length - b.style.name.length ||
        b.style.variants.length - a.style.variants.length,
    )
    .filter((x) => {
      if (iconSeen.has(x.story.tagline)) return false;
      iconSeen.add(x.story.tagline);
      return true;
    })
    .sort((a, b) => b.style.variants.length - a.style.variants.length)
    .slice(0, 6);

  const [resale, images, brandPosts, allBrands, iconPosts] = await Promise.all([
    getBrandResaleStats(id),
    getVariantImages(
      liveStyles.map((s) => s.variants[0]?.variantId).filter((n): n is number => n != null),
    ),
    listByBrand(id, 4),
    getBrandsOverview(),
    Promise.all(iconStyles.map((x) => listByStyle(x.style.styleId, 1))),
  ]);

  // "Similar houses" — the Spotify "similar artists" edge. Same tier first (what a
  // shopper is most likely cross-considering), then by catalogue depth. Live only.
  const similarHouses = allBrands
    .filter((b) => b.brandId !== id && b.isLive)
    .sort((a, b) => {
      const sameA = a.tier === brand.tier ? 0 : 1;
      const sameB = b.tier === brand.tier ? 0 : 1;
      return sameA - sameB || b.variantCount - a.variantCount || a.name.localeCompare(b.name);
    })
    .slice(0, 6);

  // At-a-glance, all derived from the catalogued variants (real, never invented).
  const prices = allVariants.map((v) => v.retailPrice).filter((n): n is number => n != null);
  const priceCurrency = allVariants.find((v) => v.retailPrice != null)?.currency ?? null;
  const ladder = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
  const topColors = topN(allVariants.map((v) => v.exteriorColorway), 6);
  const topMaterials = topN(allVariants.map((v) => v.material), 5);
  const topHardware = topN(allVariants.map((v) => v.hardwareColor), 4);
  const topSilhouettes = topN(brand.styles.map((s) => s.silhouette), 5);

  // Through the years — founding plus the dated arrival of notable styles, from
  // data we already hold. Icons label the line where we have their year; if none
  // carry a year, fall back to the earliest-dated styles so the line still reads.
  const iconYearLabels = iconStyles
    .filter((x) => x.style.yearIntroduced != null)
    .map((x) => ({ year: x.style.yearIntroduced as number, label: x.style.name }));
  const fallbackYearLabels = liveStyles
    .filter((s) => s.yearIntroduced != null)
    .sort((a, b) => (a.yearIntroduced as number) - (b.yearIntroduced as number))
    .map((s) => ({ year: s.yearIntroduced as number, label: s.name }));
  const milestones = [
    ...(brand.foundedYear ? [{ year: brand.foundedYear, label: "House founded" }] : []),
    ...(iconYearLabels.length > 0 ? iconYearLabels : fallbackYearLabels),
  ]
    .sort((a, b) => a.year - b.year)
    .filter((m, i, arr) => i === 0 || m.year !== arr[i - 1].year || m.label !== arr[i - 1].label)
    .slice(0, 6);

  // The calm catalogue: every style as a compact card, richest (most variants) first.
  const catalogStyles = [...liveStyles].sort(
    (a, b) => b.variants.length - a.variants.length || a.name.localeCompare(b.name),
  );

  const buyLinks = buildResaleLinks(brand.name, "");
  const sellLinks = buildConsignmentLinks(brand.name, "");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-10">
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">{brand.name}</span>
      </nav>

      {/* Heritage header */}
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          {brand.tier.replace("-", " ")}
          {brand.countryOfOrigin ? ` · ${brand.countryOfOrigin}` : ""}
          {brand.foundedYear ? ` · est. ${brand.foundedYear}` : ""}
        </p>
        <h1 className="mt-1 font-serif text-4xl text-foreground">{brand.name}</h1>
      </header>

      {/* The house story — never a wall: serif lead, heritage strip, icon beats */}
      <HouseStory
        name={brand.name}
        description={brand.description}
        foundedYear={brand.foundedYear}
        countryOfOrigin={brand.countryOfOrigin}
        tier={brand.tier}
        stylesCount={brand.styles.length}
      />

      {/* The icons — signature styles with their sourced origin, the hero of the page */}
      {iconStyles.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl text-foreground">The icons</h2>
          <p className="mt-1 text-sm text-muted">
            The bags that made the house, and where they came from.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {iconStyles.map(({ style, story }, i) => {
              const lead = style.variants[0];
              const from = styleFrom(style);
              const post = iconPosts[i]?.[0] ?? null;
              return (
                <article
                  key={style.styleId}
                  className="flex flex-col rounded-2xl border border-gold/30 bg-gold/5 p-5"
                >
                  <div className="flex items-start gap-4">
                    <BagImage
                      imageUrl={lead ? images[lead.variantId] : null}
                      brand={brand.name}
                      className="h-20 w-20 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0">
                      <h3 className="font-serif text-xl text-foreground">{style.name}</h3>
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-muted/70">
                        {[
                          style.silhouette,
                          from ? `from ${fmt(from.amount, from.currency)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{story.tagline}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {lead && (
                      <Link
                        href={`/bag/${lead.variantId}`}
                        className="text-gold transition-colors hover:text-gold-soft"
                      >
                        Read the full story →
                      </Link>
                    )}
                    {post && (
                      <Link
                        href={`/articles/${post.slug}`}
                        className="text-muted transition-colors hover:text-foreground"
                      >
                        {post.title}
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Through the years — the house timeline, built from dates we already hold */}
      {milestones.length >= 2 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl text-foreground">Through the years</h2>
          <ol className="flex gap-0 overflow-x-auto pb-2">
            {milestones.map((m, i) => (
              <li key={`${m.year}-${m.label}`} className="flex min-w-0 shrink-0 items-center">
                <div className="w-32 shrink-0">
                  <p className="font-serif text-lg text-gold-soft">{m.year}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{m.label}</p>
                </div>
                {i < milestones.length - 1 && (
                  <span className="mx-1 h-px w-8 shrink-0 bg-border" aria-hidden />
                )}
              </li>
            ))}
            <li className="flex shrink-0 items-center">
              <span className="mx-1 h-px w-8 shrink-0 bg-border" aria-hidden />
              <p className="font-serif text-lg text-muted">today</p>
            </li>
          </ol>
        </section>
      )}

      {/* At a glance */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <Stat label="Styles" value={brand.styles.length.toString()} />
        <Stat label="Variants" value={allVariants.length.toString()} />
        <Stat
          label="Retail ladder"
          value={
            ladder ? `${fmt(ladder.min, priceCurrency)}–${fmt(ladder.max, priceCurrency)}` : "—"
          }
          sub={ladder ? "entry → grail" : undefined}
        />
        <Stat
          label="Highest resale"
          value={resale.highestSale != null ? (fmt(resale.highestSale, resale.currency) ?? "—") : "—"}
          sub={resale.recordedSales > 0 ? `recorded · ${resale.recordedSales} sales` : "no data yet"}
        />
        <Stat
          label="Avg resale"
          value={resale.avgSale != null ? (fmt(resale.avgSale, resale.currency) ?? "—") : "—"}
          sub={
            resale.trend === "up" ? "↑ trending up" :
            resale.trend === "down" ? "↓ trending down" :
            resale.trend === "flat" ? "→ steady" :
            undefined
          }
        />
      </section>

      {/* Signatures — most common attributes across the brand's catalog */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-serif text-xl text-foreground">{brand.name} signatures</h2>
        <p className="mt-1 text-sm text-muted">
          The most common attributes across {allVariants.length} catalogued variants.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted/70">Colours</p>
            <Chips items={topColors} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted/70">Materials</p>
            <Chips items={topMaterials} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted/70">Hardware</p>
            <Chips items={topHardware} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted/70">Silhouettes</p>
            <Chips items={topSilhouettes} />
          </div>
        </div>
      </section>

      {/* The full catalogue — calm style-first grid, variants live one tap down */}
      {catalogStyles.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl text-foreground">Every {brand.name} style</h2>
          <p className="mt-1 max-w-prose text-sm text-muted">
            A style is the model. Open one to see its variants: the exact size,
            colour, leather and hardware.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalogStyles.map((style) => {
              const lead = style.variants[0];
              const from = styleFrom(style);
              return (
                <Link
                  key={style.styleId}
                  href={lead ? `/bag/${lead.variantId}` : "#"}
                  className="group flex gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-gold"
                >
                  <BagImage
                    imageUrl={lead ? images[lead.variantId] : null}
                    brand={brand.name}
                    className="h-14 w-14 shrink-0 rounded-lg"
                  />
                  <div className="flex min-w-0 flex-col">
                    <h3 className="truncate font-serif text-base text-foreground group-hover:text-gold">
                      {style.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {[
                        style.silhouette,
                        style.yearIntroduced ? `${style.yearIntroduced}` : null,
                        style.discontinued ? "discontinued" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-auto pt-1 text-xs text-muted/70">
                      {style.variants.length} {style.variants.length === 1 ? "variant" : "variants"}
                      {from ? ` · from ${fmt(from.amount, from.currency)}` : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {stubStyles.length > 0 && (
        <section>
          <h2 className="mb-2 font-serif text-xl text-foreground">More {brand.name} styles</h2>
          <p className="mb-4 text-sm text-muted">
            These are in the catalog but we haven&rsquo;t fully researched them
            yet: names and years for now, the full detail to come.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stubStyles.map((style) => (
              <div
                key={style.styleId}
                className="rounded-xl border border-border bg-surface/40 px-4 py-3 text-sm"
              >
                <p className="text-foreground">{style.name}</p>
                {style.yearIntroduced && (
                  <p className="mt-0.5 text-xs text-muted">{style.yearIntroduced}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {brand.styles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
          No {brand.name} styles in the catalog yet — they&rsquo;re on the list.
        </div>
      )}

      {/* Where to buy / sell — brand-level */}
      {(buyLinks.length > 0 || sellLinks.length > 0) && (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-serif text-xl text-foreground">Shop {brand.name} resale</h2>
          {buyLinks.length > 0 && (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-muted/70">Where to buy</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {buyLinks.map((l) => (
                  <a
                    key={l.key}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
                  >
                    {l.name} →
                  </a>
                ))}
              </div>
            </div>
          )}
          {sellLinks.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted/70">Where to sell</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sellLinks.map((l) => (
                  <a
                    key={l.key}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
                  >
                    {l.name} →
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Read more on the house — editorial, woven by topic (curated, never invented) */}
      <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <h2 className="font-serif text-xl text-foreground">Read more on {brand.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          What it&rsquo;s actually like to buy {brand.name}: the history, the waitlists
          and boutique relationships, what it&rsquo;s resold for, and which pieces hold
          their value.
        </p>
        {brandPosts.length > 0 ? (
          <div className="mt-4">
            <ArticleList posts={brandPosts} />
            <Link
              href={`/articles?brand=${id}`}
              className="mt-3 inline-block text-sm text-gold transition-colors hover:text-gold-soft"
            >
              All {brand.name} articles →
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted/70">
            Guides for {brand.name} are on the way.
          </p>
        )}
      </section>

      {/* Similar houses — lateral discovery across brands (Spotify "similar artists"). */}
      {similarHouses.length > 0 && (
        <section className="border-t border-border pt-8">
          <h2 className="mb-4 font-serif text-xl text-foreground">Similar houses</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {similarHouses.map((b) => (
              <Link
                key={b.brandId}
                href={`/brand/${b.brandId}`}
                className="group flex w-24 shrink-0 flex-col items-center text-center"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-border font-serif text-2xl text-gold-soft transition-colors group-hover:border-gold">
                  {b.name.charAt(0)}
                </span>
                <span className="mt-2 line-clamp-2 font-serif text-sm text-foreground">{b.name}</span>
                <span className="text-xs capitalize text-muted">{b.tier.replace("-", " ")}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="font-serif text-lg text-foreground">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted/60">{sub}</p>}
    </div>
  );
}
