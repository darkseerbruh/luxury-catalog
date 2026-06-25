import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBySlug } from "@/lib/posts";
import { getCurrentUser } from "@/lib/auth";
import { AUTHOR_NAME, SITE_URL } from "@/lib/geo";
import { PostBagCTA } from "./PostBagCTA";

export const dynamic = "force-dynamic";

// Dedupe the fetch across generateMetadata + the page render.
const getPost = cache(getBySlug);

function authorName(post: Awaited<ReturnType<typeof getBySlug>>): string {
  return (
    post?.author?.displayName ||
    (post?.author?.handle ? `@${post.author.handle}` : null) ||
    AUTHOR_NAME
  );
}

function plainExcerpt(post: NonNullable<Awaited<ReturnType<typeof getBySlug>>>): string {
  if (post.excerpt) return post.excerpt;
  const text = (post.body ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= 157) return text;
  return text.slice(0, 154).replace(/\s+\S*$/, "") + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article · The Luxury Catalog" };

  const title = `${post.title} · The Luxury Catalog`;
  const description = plainExcerpt(post);
  const url = `${SITE_URL}/posts/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      authors: [authorName(post)],
    },
    twitter: { card: "summary", title: post.title, description },
  };
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Render the body as paragraphs (plain text, newline-delimited). No HTML is
 * injected from user content — each block is rendered as escaped text. */
function Body({ body }: { body: string | null }) {
  if (!body) return null;
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-4 text-foreground">
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-line text-base leading-relaxed">
          {block}
        </p>
      ))}
    </div>
  );
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const user = await getCurrentUser();
  const isAuthor = user?.id === post.author?.userId;
  const date = formatDate(post.publishedAt) ?? formatDate(post.createdAt);
  const name = authorName(post);

  const hasTopic = Boolean(
    (post.topic.brandId && post.topic.brandName) || (post.topic.styleId && post.topic.styleName)
  );

  // Article JSON-LD with a named-author byline (E-E-A-T). Only includes fields
  // that exist; no invented data.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url: `${SITE_URL}/posts/${post.slug}`,
    author: {
      "@type": "Person",
      name,
      ...(post.author?.handle ? { url: `${SITE_URL}/u/${post.author.handle}` } : {}),
    },
    publisher: { "@type": "Organization", name: "The Luxury Catalog" },
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    ...(post.excerpt ? { description: post.excerpt } : {}),
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10">
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/posts" className="hover:text-foreground">Articles</Link>
      </nav>

      <header>
        {post.status !== "published" && (
          <p className="mb-3 inline-block rounded-full border border-gold/40 px-3 py-1 text-xs uppercase tracking-wide text-gold">
            {post.status === "draft" ? "Draft — only you can see this" : post.status}
          </p>
        )}
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-muted">
          By{" "}
          {post.author?.handle ? (
            <Link href={`/u/${post.author.handle}`} className="text-foreground hover:text-gold">
              {name}
            </Link>
          ) : (
            name
          )}
          {post.author?.isExpert && (
            <span className="ml-2 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
              Verified expert
            </span>
          )}
          {date ? ` · ${date}` : ""}
        </p>
        {isAuthor && (
          <Link
            href={`/posts/${post.slug}/edit`}
            className="mt-3 inline-block rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
          >
            Edit article
          </Link>
        )}
      </header>

      {post.excerpt && (
        <p className="border-l-2 border-gold/40 pl-4 text-lg leading-relaxed text-muted">
          {post.excerpt}
        </p>
      )}

      <article>
        <Body body={post.body} />
      </article>

      {/* Money-moment: topic-tagged posts hand off to commissionable buy/sell links */}
      {hasTopic && (post.topic.brandName || post.topic.styleName) && (
        <PostBagCTA brandName={post.topic.brandName} styleName={post.topic.styleName} slug={post.slug} />
      )}

      {/* Sources / related — link to the brand or style this article covers */}
      {hasTopic && (
        <section className="border-t border-border pt-6">
          <h2 className="mb-3 font-serif text-lg text-foreground">Related in the catalog</h2>
          <div className="flex flex-wrap gap-2">
            {post.topic.brandId && post.topic.brandName && (
              <Link
                href={`/brand/${post.topic.brandId}`}
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                {post.topic.brandName}
              </Link>
            )}
            {post.topic.styleId && post.topic.styleName && (
              <Link
                href={`/search?q=${encodeURIComponent(post.topic.styleName)}`}
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                {post.topic.styleName}
              </Link>
            )}
          </div>
        </section>
      )}

      <footer className="border-t border-border pt-6 text-sm text-muted">
        <Link href="/posts" className="hover:text-gold">← All articles</Link>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
