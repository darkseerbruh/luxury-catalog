import type { Metadata } from "next";
import Link from "next/link";
import { BagImage } from "@/components/BagImage";
import StandingGlyph from "@/components/StandingGlyph";
import MovementPill from "@/components/MovementPill";
import { getLcIndex, whyNote } from "@/lib/lc-index";
import { getVariantImages, getHouseStandings } from "@/lib/queries";
import { tierDisplay } from "@/lib/house-standing";
import { SITE_URL } from "@/lib/geo";

export const metadata: Metadata = {
  title: "The LC Index — where every bag stands in the market",
  description:
    "The LC Index ranks handbag styles by market standing: a blend of resale price, trade volume, and scarcity, weighted by brand tier. Our index, not a verdict.",
};

// The index is cached in getLcIndex; the page itself revalidates hourly.
export const revalidate = 3600;

/** How many ranked styles the page lists. */
const PAGE_LIMIT = 100;

/** How many brands the companion "Brands by standing" board shows (full leaderboard on /brands). */
const BRAND_BOARD_LIMIT = 10;

function fmtPrice(median: number | null): string {
  if (median == null) return "—";
  return `$${Math.round(median).toLocaleString()}`;
}

export default async function RankingsPage() {
  const [data, standings] = await Promise.all([getLcIndex(), getHouseStandings()]);
  const rows = data.ranked.slice(0, PAGE_LIMIT);

  // Companion brand leaderboard: the same read one level up (House Standing).
  // Placed brands only, already in rank order; the board shows the top few.
  const rankedBrands = standings.filter((s) => s.rank != null);
  const brandBoard = rankedBrands.slice(0, BRAND_BOARD_LIMIT);

  const variantIds = rows.map((r) => r.repVariantId).filter((id): id is number => id != null);
  const images = variantIds.length > 0 ? await getVariantImages(variantIds) : {};

  // Citable ranked asset for AI search / Google (docs/marketing-plan.md, GEO). One
  // ItemList entry per ranked bag, in rank order, each pointing at its bag page.
  const itemListJsonLd =
    rows.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "The LC Index",
          description:
            "Handbag styles ranked by market standing: resale price, trade volume, and scarcity, weighted by brand tier.",
          numberOfItems: rows.length,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          itemListElement: rows.map((r) => ({
            "@type": "ListItem",
            position: r.rank,
            name: `${r.brandName} ${r.styleName}`,
            url: r.repVariantId != null ? `${SITE_URL}/bag/${r.repVariantId}` : undefined,
          })),
        }
      : null;

  // Second citable asset (GEO): the brand leaderboard, every placed brand in rank
  // order. Its own ItemList so AI search can quote "top handbag brands by standing".
  const brandItemListJsonLd =
    rankedBrands.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "House Standing — handbag brands by resale standing",
          description:
            "Handbag brands ranked by House Standing: resale median, ceiling, and trade volume. Our standing, not a verdict.",
          numberOfItems: rankedBrands.length,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          itemListElement: rankedBrands.map((b) => ({
            "@type": "ListItem",
            position: b.rank,
            name: b.name,
            url: `${SITE_URL}/brand/${b.brandId}`,
          })),
        }
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {brandItemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandItemListJsonLd) }}
        />
      )}
      <header className="mb-6">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gold">The LC Index</p>
        <h1 className="font-serif text-3xl text-foreground">Where every bag stands</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          One number for where a handbag sits in the whole market. Rank blends resale price,
          trade volume, and scarcity, weighted by brand tier, over{" "}
          <span className="text-foreground">recorded market prices</span>. Recomputed monthly.
        </p>
        <p className="mt-2 text-xs text-muted">
          Our index, not a verdict.{" "}
          <Link href="/rankings/how-we-rank" className="text-gold-soft underline underline-offset-2">
            How we rank
          </Link>
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          The Index is warming up. Rankings appear once the market data behind them is in place.
        </p>
      ) : (
        <>
          <ol className="border-t border-border">
            {rows.map((r) => {
              const href = r.repVariantId != null ? `/bag/${r.repVariantId}` : `/brand/${r.brandId}`;
              return (
                <li key={r.styleId} className="border-b border-border">
                  <div className="flex items-start gap-3 px-1 py-3.5 sm:gap-4">
                    <div className="w-7 shrink-0 pt-0.5 text-right font-serif text-2xl text-gold-soft tabular-nums sm:w-9">
                      {r.rank}
                    </div>
                    <Link
                      href={href}
                      className="hidden shrink-0 sm:block"
                      aria-label={`${r.brandName} ${r.styleName}`}
                    >
                      <BagImage
                        imageUrl={r.repVariantId != null ? images[r.repVariantId] : null}
                        brand={r.brandName}
                        alt={`${r.brandName} ${r.styleName}`}
                        invite={false}
                        className="h-14 w-14 rounded-lg"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      {/* Name + movement on the left, resale median pinned right. */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Link href={href} className="text-[15px] text-foreground hover:text-gold-soft">
                              <span className="font-semibold">{r.styleName}</span>
                              <span className="text-muted"> · {r.brandName}</span>
                            </Link>
                            <MovementPill rank={r.rank} previousRank={r.previousRank} />
                          </div>
                          <p className="mt-0.5 text-[11.5px] text-muted">{whyNote(r)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-serif text-base text-foreground tabular-nums">
                            {fmtPrice(r.resaleMedian)}
                          </div>
                          <div className="text-[10.5px] text-muted/60">
                            {r.priceCount.toLocaleString()} {r.priceCount === 1 ? "price" : "prices"}
                          </div>
                        </div>
                      </div>
                      {/* The why-meter, capped so it stays readable on wide screens. */}
                      <StandingGlyph
                        pricePct={r.pricePct}
                        tradePct={r.tradePct}
                        scarcityPct={r.scarcityPct}
                        lead={r.lead}
                        className="max-w-[320px]"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted/60">
            Showing the top {rows.length.toLocaleString()} of {data.totalRanked.toLocaleString()} ranked
            styles. A style needs enough recorded prices to be ranked.
          </p>
        </>
      )}

      {/* Companion board: the LC Index at the brand level (House Standing). Bags stay
          the hero above; this is the secondary read, with its own citable ItemList. */}
      {brandBoard.length > 0 && (
        <section className="mt-14 border-t border-border pt-8">
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gold">Brands by standing</p>
          <h2 className="font-serif text-2xl text-foreground">Where each brand stands</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            The same read, one level up. House Standing blends a brand&rsquo;s resale median, its
            ceiling, and how actively it trades. Our standing, not a verdict.{" "}
            <Link href="/how-we-tier" className="text-gold-soft underline underline-offset-2">
              How we tier
            </Link>
          </p>
          <ol className="mt-5 border-t border-border">
            {brandBoard.map((b) => {
              const t = tierDisplay(b.tier == null ? null : String(b.tier));
              return (
                <li key={b.brandId} className="border-b border-border">
                  <Link
                    href={`/brand/${b.brandId}`}
                    className="group flex items-baseline gap-4 px-1 py-3"
                  >
                    <span className="w-7 shrink-0 text-right font-serif text-xl text-gold-soft tabular-nums">
                      {b.rank}
                    </span>
                    <span className="font-serif text-lg text-foreground group-hover:text-gold-soft">
                      {b.name}
                    </span>
                    <span className="ml-auto flex items-baseline gap-3">
                      {t.label && (
                        <span className="text-[11px] uppercase tracking-wide text-muted/70">{t.label}</span>
                      )}
                      <span className="font-serif text-base text-foreground tabular-nums">
                        {b.score?.toFixed(1)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted/60">
            Showing the top {brandBoard.length} of {rankedBrands.length.toLocaleString()} ranked brands.{" "}
            <Link href="/brands?view=ranking" className="text-gold-soft underline underline-offset-2">
              See all brands
            </Link>
          </p>
        </section>
      )}
    </main>
  );
}
