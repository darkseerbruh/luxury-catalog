import { searchCatalog, getVariantImages } from "@/lib/queries";
import RequestBagForm from "./RequestBagForm";
import SearchTracker from "./SearchTracker";
import SearchFilters from "./SearchFilters";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query
    ? await searchCatalog(query)
    : { brands: [], styles: [], interpreted: [], usedNaturalLanguage: false };
  const hasResults = results.brands.length > 0 || results.styles.length > 0;

  // Representative photo per style (its first variant) for the result cards.
  const images = hasResults
    ? await getVariantImages([
        ...results.styles.flatMap((s) => s.variants.map((v) => v.variantId)),
        ...results.brands.flatMap((b) =>
          b.styles.map((s) => s.variantId).filter((n): n is number => n != null),
        ),
      ])
    : {};

  return (
    <main className="flex flex-1 flex-col px-5 py-10">
      {query && (
        <SearchTracker
          query={query}
          resultCount={results.brands.length + results.styles.length}
        />
      )}
      <form method="GET" className="mx-auto flex w-full max-w-md items-center gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search — e.g. “structured black bag under 10 inches wide”"
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
            Search by brand (&ldquo;Chanel&rdquo;), by style
            (&ldquo;Birkin&rdquo;), or just describe what you&rsquo;re after —
            &ldquo;structured black crossbody under 10 inches wide&rdquo;.
          </p>
        )}

        {query && results.usedNaturalLanguage && results.interpreted.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>Interpreted as:</span>
            {results.interpreted.map((part) => (
              <span
                key={part}
                className="rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-gold/90"
              >
                {part}
              </span>
            ))}
          </div>
        )}

        {query && !hasResults && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
            <p className="text-foreground">
              Nothing for &ldquo;{query}&rdquo; yet.
            </p>
            <p className="mt-2 text-sm text-muted">
              We haven&rsquo;t researched this one yet. Ask for it and you bump
              it up the list — the most-requested bags get done first.
            </p>
            <RequestBagForm query={query} />
          </div>
        )}

        {hasResults && <SearchFilters results={results} images={images} />}
      </div>
    </main>
  );
}
