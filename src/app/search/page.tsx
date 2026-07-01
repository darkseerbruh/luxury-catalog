import Link from "next/link";
import { searchCatalog, getVariantImages } from "@/lib/queries";
import { hybridSearch } from "@/lib/hybrid-search";
import { listPublished } from "@/lib/posts";
import { getCurrentUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/personalization/user-profile";
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

  // Phase-3 hybrid search: fetch user profile in parallel with hybrid search candidates.
  // Falls back to plain searchCatalog when VOYAGE_API_KEY is absent or user is logged out.
  const user = query ? await getCurrentUser() : null;
  const profile = user ? await getUserProfile(user.id) : null;

  const results = query
    ? process.env.VOYAGE_API_KEY
      ? await hybridSearch(query, profile).then(async (hybridStyles) => {
          // Hybrid search only returns styles — run the existing brand search in parallel.
          const base = await searchCatalog(query);
          return {
            brands: base.brands,
            styles: hybridStyles.length > 0 ? hybridStyles : base.styles,
            interpreted: base.interpreted,
            usedNaturalLanguage: base.usedNaturalLanguage,
          };
        })
      : await searchCatalog(query)
    : { brands: [], styles: [], interpreted: [], usedNaturalLanguage: false };
  const hasResults = results.brands.length > 0 || results.styles.length > 0;

  // Unified search: also match published articles by title/excerpt, so a search
  // surfaces both browsable bags AND our content. One list query, cheap.
  const ql = query.toLowerCase();
  const articleHits = query
    ? (await listPublished())
        .filter((p) => p.title.toLowerCase().includes(ql) || (p.excerpt ?? "").toLowerCase().includes(ql))
        .slice(0, 6)
    : [];

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

        {query && !hasResults && articleHits.length === 0 && (
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

        {articleHits.length > 0 && (
          <section className="mt-10">
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-gold">From Articles</p>
            <div className="grid gap-x-10 sm:grid-cols-2">
              {articleHits.map((p) => (
                <Link
                  key={p.postId}
                  href={`/articles/${p.slug}`}
                  className="group flex items-baseline gap-2.5 border-b border-border/60 py-2.5"
                >
                  <span className="shrink-0 text-gold">&rarr;</span>
                  <span className="font-serif text-[15px] leading-snug text-foreground group-hover:text-gold-soft">
                    {p.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
