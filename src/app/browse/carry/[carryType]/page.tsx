import Link from "next/link";
import { getVariantsByCarry } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CARRY_LABELS: Record<string, string> = {
  shoulder: "Shoulder bags",
  crossbody: "Crossbody bags",
  "top-handle": "Top handle bags",
  backpack: "Backpacks",
  "belt-bag": "Belt bags",
  clutch: "Clutches",
  luggage: "Luggage",
};

export default async function BrowseCarryPage({
  params,
}: {
  params: Promise<{ carryType: string }>;
}) {
  const { carryType } = await params;
  const label = CARRY_LABELS[carryType] ?? carryType.replace(/-/g, " ");
  const variants = await getVariantsByCarry(carryType);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/#carry" className="hover:text-foreground">
          By how they&rsquo;re carried
        </Link>
        <span>/</span>
        <span className="text-foreground capitalize">{label}</span>
      </nav>

      <header>
        <h1 className="font-serif text-4xl text-foreground capitalize">
          {label}
        </h1>
        <p className="mt-2 text-muted">
          {variants.length > 0
            ? `${variants.length} ${variants.length === 1 ? "variant" : "variants"} in the catalog`
            : "Nothing cataloged for this carry style yet."}
        </p>
      </header>

      {variants.length > 0 ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {variants.map((v) => (
            <li key={v.variantId}>
              <Link
                href={`/bag/${v.variantId}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface-raised"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm uppercase tracking-wide text-muted">
                    {v.brandName}
                  </p>
                  <p className="mt-0.5 font-serif text-lg text-foreground">
                    {v.styleName}
                  </p>
                  {(v.sizeLabel || v.exteriorColorway) && (
                    <p className="mt-0.5 text-sm text-muted">
                      {[v.sizeLabel, v.exteriorColorway]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {v.contextNote && (
                    <p className="mt-1 text-xs text-muted/70">{v.contextNote}</p>
                  )}
                </div>
                <span className="shrink-0 text-sm text-gold">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
          We haven&rsquo;t mapped carry data for this style yet. Searches like
          this are how we decide what to research next.
          <br />
          <Link
            href="/search"
            className="mt-3 inline-block text-gold hover:underline"
          >
            Search the catalog instead →
          </Link>
        </div>
      )}
    </main>
  );
}
