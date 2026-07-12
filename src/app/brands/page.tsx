import { getBrandsOverview, getHouseStandings } from "@/lib/queries";
import BrandsExplorer, { type BrandRow, type View } from "./BrandsExplorer";

export const dynamic = "force-dynamic";

const VIEW_KEYS = ["az", "ranking", "tier", "origin", "heritage"] as const;

/** A URL ?view= value, when it names a real view (else the A–Z default). */
function asView(raw: string | undefined): View {
  return raw && (VIEW_KEYS as readonly string[]).includes(raw) ? (raw as View) : "az";
}

export const metadata = {
  title: "All brands · Luxury Catalog",
  description:
    "Every designer handbag brand we cover. Sort by ranking, tier, origin, or heritage, with production history, authentication markers, and real resale prices for each.",
};

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const [brands, standings] = await Promise.all([getBrandsOverview(), getHouseStandings()]);

  // Merge live House Standing (score + rank) onto each brand for the ranking view.
  const standingById = new Map(standings.map((s) => [s.brandId, s]));
  const rows: BrandRow[] = brands.map((b) => {
    const s = standingById.get(b.brandId);
    return {
      brandId: b.brandId,
      name: b.name,
      tier: b.tier,
      isLive: b.isLive,
      variantCount: b.variantCount,
      topStyles: b.topStyles,
      score: s?.score ?? null,
      rank: s?.rank ?? null,
      country: b.country,
      foundedYear: b.foundedYear,
    };
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <h1 className="font-serif text-3xl text-foreground">All brands</h1>
      <p className="mt-2 max-w-xl text-muted">
        Every brand we cover. Pick a way to look through them, then open one for its full
        catalog and real resale prices.
      </p>

      <BrandsExplorer rows={rows} initialView={asView(view)} />
    </main>
  );
}
