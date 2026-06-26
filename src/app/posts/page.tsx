import type { Metadata } from "next";
import Link from "next/link";
import { listPublished } from "@/lib/posts";
import { getProfile } from "@/lib/auth";
import { SITE_URL } from "@/lib/geo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles — how to spot the real thing, and what it's worth · The Luxury Catalog",
  description:
    "Guides on authenticating designer handbags, their production history, and what holds value — written straight by The Luxury Catalog's verified experts.",
  alternates: { canonical: `${SITE_URL}/posts` },
  openGraph: {
    title: "Articles · The Luxury Catalog",
    description:
      "Guides on authenticating designer handbags, their production history, and what holds value.",
    url: `${SITE_URL}/posts`,
    type: "website",
  },
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand = "" } = await searchParams;
  const [allPosts, profile] = await Promise.all([listPublished(), getProfile()]);

  // Brand filter facets, built only from brands that actually have articles — so we
  // never offer a brand that leads to an empty list.
  const facetMap = new Map<number, { brandId: number; name: string; count: number }>();
  for (const p of allPosts) {
    if (p.topic.brandId != null && p.topic.brandName) {
      const e =
        facetMap.get(p.topic.brandId) ??
        { brandId: p.topic.brandId, name: p.topic.brandName, count: 0 };
      e.count += 1;
      facetMap.set(p.topic.brandId, e);
    }
  }
  const brandFacets = [...facetMap.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );

  const activeBrandId =
    brand && Number.isFinite(Number(brand)) ? Number(brand) : null;
  const posts = activeBrandId
    ? allPosts.filter((p) => p.topic.brandId === activeBrandId)
    : allPosts;

  const filterPill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
      active
        ? "border-gold text-gold"
        : "border-border text-muted hover:border-gold hover:text-gold"
    }`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted">Editorial</p>
          <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">Articles</h1>
          <p className="mt-2 max-w-prose text-muted">
            How to spot the real thing, where a bag came from, and what it actually holds in
            resale — from our verified experts.
          </p>
          <p className="mt-3 max-w-prose text-sm text-muted">
            Checking a specific bag right now?{" "}
            <Link href="/identify" className="text-gold hover:underline">Identify it from a photo</Link>{" "}
            or <Link href="/authenticate" className="text-gold hover:underline">request a pro review</Link>.
          </p>
        </div>
        {profile?.isExpert && (
          <Link
            href="/posts/new"
            className="shrink-0 self-start rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Write an article
          </Link>
        )}
      </header>

      {brandFacets.length > 0 && (
        <nav className="flex flex-wrap gap-2" aria-label="Filter articles by brand">
          <Link href="/posts" className={filterPill(!activeBrandId)}>
            All
          </Link>
          {brandFacets.map((f) => (
            <Link
              key={f.brandId}
              href={`/posts?brand=${f.brandId}`}
              className={filterPill(activeBrandId === f.brandId)}
            >
              {f.name}{" "}
              <span className="text-muted/60">{f.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
          No articles yet. The first ones are being written — check back soon.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((p) => {
            const date = formatDate(p.publishedAt);
            const byline = p.author?.displayName || (p.author?.handle ? `@${p.author.handle}` : null);
            return (
              <li key={p.postId}>
                <Link
                  href={`/posts/${p.slug}`}
                  className="block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-gold"
                >
                  <h2 className="font-serif text-xl text-foreground">{p.title}</h2>
                  {p.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{p.excerpt}</p>
                  )}
                  <p className="mt-3 text-xs text-muted/70">
                    {byline ? `By ${byline}` : "The Luxury Catalog"}
                    {date ? ` · ${date}` : ""}
                    {p.topic.brandName ? ` · ${p.topic.brandName}` : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
