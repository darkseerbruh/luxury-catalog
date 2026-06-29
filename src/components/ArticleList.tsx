import Link from "next/link";
import type { PostSummary } from "@/lib/posts";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Compact list of article cards, reused on the brand hub (brand-tagged guides)
 * and the bag page (style/brand-tagged guides). Renders nothing when empty so
 * callers can drop it in unconditionally.
 */
export function ArticleList({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3">
      {posts.map((p) => {
        const date = formatDate(p.publishedAt);
        const byline =
          p.author?.displayName || (p.author?.handle ? `@${p.author.handle}` : null);
        return (
          <li key={p.postId}>
            <Link
              href={`/articles/${p.slug}`}
              className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-gold"
            >
              <h3 className="font-serif text-base text-foreground">{p.title}</h3>
              {p.excerpt && (
                <p className="mt-1 text-sm leading-relaxed text-muted">{p.excerpt}</p>
              )}
              <p className="mt-2 text-xs text-muted/70">
                {byline ? `By ${byline}` : "The Luxury Catalog"}
                {date ? ` · ${date}` : ""}
                {p.topic.styleName ? ` · ${p.topic.styleName}` : ""}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
