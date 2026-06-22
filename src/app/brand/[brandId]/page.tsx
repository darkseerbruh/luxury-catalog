import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">{brand.name}</span>
      </nav>

      {/* Header */}
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          {brand.tier.replace("-", " ")}
          {brand.countryOfOrigin ? ` · ${brand.countryOfOrigin}` : ""}
          {brand.foundedYear ? ` · est. ${brand.foundedYear}` : ""}
        </p>
        <h1 className="mt-1 font-serif text-4xl text-foreground">
          {brand.name}
        </h1>
        {brand.description && (
          <p className="mt-4 text-muted">{brand.description}</p>
        )}
      </header>

      {/* Live styles */}
      {liveStyles.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl text-foreground">
            {brand.name} styles
          </h2>
          <div className="flex flex-col gap-6">
            {liveStyles.map((style) => (
              <div
                key={style.styleId}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-serif text-xl text-foreground">
                      {style.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {[
                        style.silhouette,
                        style.yearIntroduced
                          ? `introduced ${style.yearIntroduced}`
                          : null,
                        style.discontinued ? "discontinued" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="text-sm text-muted">
                    {style.variants.length}{" "}
                    {style.variants.length === 1 ? "variant" : "variants"}
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
                          {[v.sizeLabel, v.exteriorColorway]
                            .filter(Boolean)
                            .join(" · ") || "Variant"}
                        </span>
                        {v.hardwareColor && (
                          <span className="text-muted">
                            {v.hardwareColor} hardware
                          </span>
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

      {/* Breadth-only styles (stubs) */}
      {stubStyles.length > 0 && (
        <section>
          <h2 className="mb-2 font-serif text-xl text-foreground">
            More {brand.name} styles
          </h2>
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
                  <p className="mt-0.5 text-xs text-muted">
                    {style.yearIntroduced}
                  </p>
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
