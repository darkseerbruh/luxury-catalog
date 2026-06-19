import Link from "next/link";
import { searchCatalog } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchCatalog(query) : { brands: [], styles: [] };
  const hasResults = results.brands.length > 0 || results.styles.length > 0;

  return (
    <main className="flex flex-1 flex-col px-5 py-10">
      <form method="GET" className="mx-auto flex w-full max-w-md items-center gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search a brand or style…"
          autoFocus
          className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Search
        </button>
      </form>

      <div className="mx-auto mt-10 w-full max-w-2xl">
        {!query && (
          <p className="text-center text-muted">
            Search by brand (e.g. &ldquo;Chanel&rdquo;) or style (e.g.
            &ldquo;Birkin&rdquo;).
          </p>
        )}

        {query && !hasResults && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
            <p className="text-foreground">
              No results for &ldquo;{query}&rdquo;.
            </p>
            <p className="mt-2 text-sm text-muted">
              This bag isn&rsquo;t in the catalog yet — searches like this
              help us decide what to research next.
            </p>
          </div>
        )}

        {results.brands.map((brand) => (
          <div
            key={brand.brandId}
            className="mb-6 rounded-2xl border border-border bg-surface p-6"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-xl text-foreground">
                {brand.name}
              </h2>
              <span className="text-sm text-muted">
                {brand.variantCount}{" "}
                {brand.variantCount === 1 ? "result" : "results"}
              </span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted/70">
              {brand.tier.replace("-", " ")}
            </p>
            {brand.styleNames.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {brand.styleNames.map((name) => (
                  <Link
                    key={name}
                    href={`/search?q=${encodeURIComponent(name)}`}
                    className="rounded-full border border-border px-3 py-1 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {results.styles.map((style) => (
          <div
            key={style.styleId}
            className="mb-6 rounded-2xl border border-border bg-surface p-6"
          >
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted">
                  {style.brandName}
                </p>
                <h2 className="font-serif text-xl text-foreground">
                  {style.styleName}
                </h2>
              </div>
              <span className="text-sm text-muted">
                {style.variants.length}{" "}
                {style.variants.length === 1 ? "result" : "results"}
              </span>
            </div>
            {style.variants.length > 0 && (
              <ul className="mt-4 divide-y divide-border">
                {style.variants.map((variant) => (
                  <li key={variant.variantId}>
                    <Link
                      href={`/bag/${variant.variantId}`}
                      className="flex items-center justify-between py-2 text-sm transition-colors hover:text-gold"
                    >
                      <span>
                        {[variant.sizeLabel, variant.exteriorColorway]
                          .filter(Boolean)
                          .join(" · ") || "Variant"}
                      </span>
                      {variant.hardwareColor && (
                        <span className="text-muted">
                          {variant.hardwareColor} hardware
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
