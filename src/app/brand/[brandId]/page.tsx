import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandDetail, getBrandResaleStats, getVariantImages } from "@/lib/queries";
import { buildResaleLinks, buildConsignmentLinks } from "@/lib/affiliate";
import { BagImage } from "@/components/BagImage";

export const dynamic = "force-dynamic";

function symbolFor(currency: string | null): string {
  return currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
}
function fmt(amount: number | null, currency: string | null): string | null {
  if (amount == null) return null;
  return `${symbolFor(currency)}${amount.toLocaleString()}`;
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

  const [resale, images] = await Promise.all([
    getBrandResaleStats(id),
    getVariantImages(
      liveStyles.map((s) => s.variants[0]?.variantId).filter((n): n is number => n != null),
    ),
  ]);

  // At-a-glance, all derived from the catalogued variants (real, never invented).
  const prices = allVariants.map((v) => v.retailPrice).filter((n): n is number => n != null);
  const priceCurrency = allVariants.find((v) => v.retailPrice != null)?.currency ?? null;
  const ladder = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
  const topColors = topN(allVariants.map((v) => v.exteriorColorway), 6);
  const topMaterials = topN(allVariants.map((v) => v.material), 5);
  const topHardware = topN(allVariants.map((v) => v.hardwareColor), 4);
  const topSilhouettes = topN(brand.styles.map((s) => s.silhouette), 5);
  const recentStyles = brand.styles
    .filter((s) => s.yearIntroduced != null)
    .sort((a, b) => (b.yearIntroduced ?? 0) - (a.yearIntroduced ?? 0))
    .slice(0, 4);

  const buyLinks = buildResaleLinks(brand.name, "");
  const sellLinks = buildConsignmentLinks(brand.name, "");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
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
        {brand.description && <p className="mt-4 max-w-prose text-muted">{brand.description}</p>}
      </header>

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

      {/* Culture & buying experience — editorial slot (curated, never invented) */}
      <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <h2 className="font-serif text-xl text-foreground">Culture &amp; buying experience</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          What it&rsquo;s actually like to buy {brand.name}: the history, the waitlists
          and boutique relationships, what it&rsquo;s resold for, and which pieces hold
          their value.
        </p>
        <Link
          href={`/articles?brand=${id}`}
          className="mt-3 inline-block text-sm text-gold transition-colors hover:text-gold-soft"
        >
          {brand.name} articles &amp; guides →
        </Link>
      </section>

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

      {/* Recently introduced */}
      {recentStyles.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-xl text-foreground">Recently introduced</h2>
          <div className="flex flex-wrap gap-2">
            {recentStyles.map((s) => (
              <span
                key={s.styleId}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted"
              >
                {s.name} <span className="text-muted/60">{s.yearIntroduced}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Styles */}
      {liveStyles.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl text-foreground">{brand.name} styles</h2>
          <div className="flex flex-col gap-6">
            {liveStyles.map((style) => (
              <div key={style.styleId} className="rounded-2xl border border-border bg-surface p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <BagImage
                      imageUrl={style.variants[0] ? images[style.variants[0].variantId] : null}
                      brand={brand.name}
                      className="h-16 w-16 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0">
                      <h3 className="font-serif text-xl text-foreground">{style.name}</h3>
                      <p className="mt-0.5 text-sm text-muted">
                        {[
                          style.silhouette,
                          style.yearIntroduced ? `introduced ${style.yearIntroduced}` : null,
                          style.discontinued ? "discontinued" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm text-muted">
                    {style.variants.length} {style.variants.length === 1 ? "variant" : "variants"}
                  </span>
                </div>

                <ul className="mt-4 divide-y divide-border">
                  {style.variants.map((v) => (
                    <li key={v.variantId}>
                      <Link
                        href={`/bag/${v.variantId}`}
                        className="flex items-center justify-between py-2 text-sm transition-colors hover:text-gold"
                      >
                        <span className="text-foreground">
                          {[v.sizeLabel, v.exteriorColorway].filter(Boolean).join(" · ") || "Variant"}
                        </span>
                        {v.hardwareColor && (
                          <span className="text-muted">{v.hardwareColor} hardware</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {stubStyles.length > 0 && (
        <section>
          <h2 className="mb-2 font-serif text-xl text-foreground">More {brand.name} styles</h2>
          <p className="mb-4 text-sm text-muted">
            These are in the catalog but we haven&rsquo;t fully researched them
            yet — names and years for now, the full detail to come.
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
