import type { Metadata } from "next";
import Link from "next/link";
import { BagImage } from "@/components/BagImage";
import StandingGlyph from "@/components/StandingGlyph";
import { getLcIndex, whyNote } from "@/lib/lc-index";
import { getVariantImages } from "@/lib/queries";
import { SITE_URL } from "@/lib/geo";

export const metadata: Metadata = {
  title: "The LC Index — where every bag stands in the market",
  description:
    "The LC Index ranks handbag styles by market standing: a blend of resale price, trade volume, and scarcity, weighted by house tier. Our index, not a verdict.",
};

// The index is cached in getLcIndex; the page itself revalidates hourly.
export const revalidate = 3600;

/** How many ranked styles the page lists. */
const PAGE_LIMIT = 100;

function fmtPrice(median: number | null): string {
  if (median == null) return "—";
  return `$${Math.round(median).toLocaleString()}`;
}

export default async function RankingsPage() {
  const data = await getLcIndex();
  const rows = data.ranked.slice(0, PAGE_LIMIT);

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
            "Handbag styles ranked by market standing: resale price, trade volume, and scarcity, weighted by house tier.",
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <header className="mb-6">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gold">The LC Index</p>
        <h1 className="font-serif text-3xl text-foreground">Where every bag stands</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          One number for where a handbag sits in the whole market. Rank blends resale price,
          trade volume, and scarcity, weighted by house tier, over{" "}
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
          <div className="grid grid-cols-[42px_56px_1fr_150px_88px] gap-4 px-1.5 pb-2 text-[10px] uppercase tracking-wider text-muted/60">
            <span className="text-right">#</span>
            <span aria-hidden="true" />
            <span>Bag</span>
            <span>Why it ranks here</span>
            <span className="text-right">Resale median</span>
          </div>
          <ol className="border-t border-border">
            {rows.map((r) => {
              const href = r.repVariantId != null ? `/bag/${r.repVariantId}` : `/brand/${r.brandId}`;
              return (
                <li key={r.styleId} className="border-b border-border">
                  <div className="grid grid-cols-[42px_56px_1fr_150px_88px] items-center gap-4 px-1.5 py-3">
                    <div className="text-right font-serif text-2xl text-gold-soft tabular-nums">
                      {r.rank}
                    </div>
                    <Link href={href} className="block" aria-label={`${r.brandName} ${r.styleName}`}>
                      <BagImage
                        imageUrl={r.repVariantId != null ? images[r.repVariantId] : null}
                        brand={r.brandName}
                        alt={`${r.brandName} ${r.styleName}`}
                        invite={false}
                        className="h-14 w-14 rounded-lg"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link href={href} className="block truncate text-[15px] text-foreground hover:text-gold-soft">
                        <span className="font-semibold">{r.styleName}</span>
                        <span className="text-muted"> · {r.brandName}</span>
                      </Link>
                      <p className="mt-1 truncate text-[11.5px] text-muted">{whyNote(r)}</p>
                    </div>
                    <StandingGlyph
                      pricePct={r.pricePct}
                      tradePct={r.tradePct}
                      scarcityPct={r.scarcityPct}
                      lead={r.lead}
                    />
                    <div className="text-right">
                      <div className="font-serif text-base text-foreground tabular-nums">
                        {fmtPrice(r.resaleMedian)}
                      </div>
                      <div className="text-[10.5px] text-muted/60">
                        {r.priceCount.toLocaleString()} {r.priceCount === 1 ? "price" : "prices"}
                      </div>
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
    </main>
  );
}
