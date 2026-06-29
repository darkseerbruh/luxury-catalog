import Link from "next/link";
import { listPublished, type PostSummary } from "@/lib/posts";
import { DEPARTMENTS, classifyDepartment } from "@/lib/article-departments";

/** Author byline, same fallback chain as the Journal. */
function byline(p: PostSummary): string {
  return p.author?.displayName || (p.author?.handle ? `@${p.author.handle}` : "The Luxury Catalog");
}

/** Newest published_at first; nulls sort last. */
function newestFirst(a: PostSummary, b: PostSummary): number {
  return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
}

/**
 * "From the Journal" home shelf — mirrors the Articles rail: the four editorial
 * departments, each with its number, its calibrated-hedge frame, and the single
 * latest headline beneath. Routes readers in by intent (is it real / what it's
 * worth / which to pick / what the market's doing) rather than a flat link list.
 * Engagement lever: article click-through + return visits; articles are also where
 * the "where to buy" affiliate links live. Renders nothing until at least one
 * article is published, so the home page never shows an empty shelf.
 */
export default async function JournalShelf() {
  const posts = await listPublished(50);
  if (posts.length === 0) return null;

  // Latest published piece per department.
  const latest = new Map<string, PostSummary>();
  for (const p of [...posts].sort(newestFirst)) {
    const dept = classifyDepartment(p);
    if (!latest.has(dept)) latest.set(dept, p);
  }

  return (
    <section className="border-b border-border px-5 py-12">
      <h2 className="font-serif text-2xl text-foreground">From the Journal</h2>
      <p className="mt-1 text-sm text-muted">Sorted by what you came to do.</p>

      <div className="mt-7 grid grid-cols-1 gap-x-8 gap-y-8 min-[360px]:grid-cols-2 lg:grid-cols-4">
        {DEPARTMENTS.map((d) => {
          const p = latest.get(d.id);
          return (
            <div key={d.id}>
              <Link
                href={`/articles?department=${d.id}`}
                className="flex items-baseline gap-2.5 border-b-2 border-gold pb-1.5"
              >
                <span className="font-serif text-lg font-bold text-gold">{d.number}</span>
                <span className="text-[13px] uppercase tracking-[0.16em] text-foreground transition-colors hover:text-gold-soft">
                  {d.label}
                </span>
              </Link>
              <p className="mb-3 mt-1.5 text-[11px] italic text-muted">{d.frame}</p>
              {p ? (
                <Link href={`/articles/${p.slug}`} className="group flex items-baseline gap-2">
                  <span className="shrink-0 text-gold">&rarr;</span>
                  <span>
                    <span className="font-serif text-[15px] leading-snug text-foreground group-hover:text-gold-soft">
                      {p.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] tracking-wide text-muted">
                      {byline(p)}
                    </span>
                  </span>
                </Link>
              ) : (
                <p className="text-[13px] text-muted/60">New guides soon</p>
              )}
            </div>
          );
        })}
      </div>

      <Link
        href="/articles"
        className="mt-8 block rounded-full border border-border px-5 py-3 text-center text-sm font-medium text-gold transition-colors hover:border-gold hover:text-gold-soft"
      >
        Read the Journal
      </Link>
    </section>
  );
}
