import type { Metadata } from "next";
import Link from "next/link";
import { listPublished } from "@/lib/posts";
import { getProfile } from "@/lib/auth";
import { SITE_URL } from "@/lib/geo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles — expert guides & authentication notes · The Luxury Catalog",
  description:
    "Editorial guides on designer handbag authentication, production history, and collecting — written by The Luxury Catalog's verified experts.",
  alternates: { canonical: `${SITE_URL}/posts` },
  openGraph: {
    title: "Articles · The Luxury Catalog",
    description:
      "Expert guides on designer handbag authentication, production history, and collecting.",
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

export default async function PostsPage() {
  const [posts, profile] = await Promise.all([listPublished(), getProfile()]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted">Editorial</p>
          <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">Articles</h1>
          <p className="mt-2 max-w-prose text-muted">
            Authentication deep-dives, production histories, and collecting guides from our
            verified experts.
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

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
          No articles published yet. Check back soon.
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
