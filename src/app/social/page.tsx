import type { Metadata } from "next";
import Link from "next/link";
import { listPublished, type PostSummary } from "@/lib/posts";
import { SOCIAL_KEYS } from "@/lib/social-search-keys";
import { SITE_URL } from "@/lib/geo";

/**
 * The permanent bio-link hub. The bio link on every social profile points here
 * and never changes; each card is an article we've covered in a video, newest
 * posting first (SOCIAL_KEYS order). Cookieless on purpose — listPublished is
 * the cached anon read, so this page stays static like the homepage.
 */

const TITLE = "From our videos · Luxury Catalog";
const DESCRIPTION =
  "Every article behind our TikToks and reels, newest first. Or type the key you heard in the video into search and it takes you straight there.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/social` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/social`,
    type: "website",
  },
};

export default async function SocialHubPage() {
  const published = await listPublished();
  const bySlug = new Map(published.map((p) => [p.slug, p]));

  // Registry order = posting order. Entries whose article isn't published yet
  // simply don't render, so the hub can never link ahead of the site.
  const entries = SOCIAL_KEYS.map((e) => ({
    ...e,
    post: bySlug.get(e.slug),
  })).filter((e): e is typeof e & { post: PostSummary } => Boolean(e.post));

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
        Luxury Catalog
      </p>
      <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
        From our videos
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Every article behind our videos, newest first. Faster route: type the
        key you heard in the video into search and it takes you straight there.
      </p>

      <form method="GET" action="/search" className="mt-5 flex items-center gap-2">
        <input
          name="q"
          type="search"
          placeholder="The key from the video, e.g. “chanel 2026”"
          className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Search
        </button>
      </form>

      <div className="mt-8">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
            The first video articles are on their way. Meanwhile, the whole
            journal is at{" "}
            <Link href="/articles" className="text-gold hover:underline">
              /articles
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4">
            {entries.map((e) => (
              <Link
                key={e.key}
                href={`/articles/${e.post.slug}`}
                className="group block rounded-lg border border-border bg-surface p-5 transition-colors hover:border-gold"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
                  <span className="rounded-full border border-gold/40 bg-gold/5 px-2.5 py-0.5 text-gold">
                    search: {e.key}
                  </span>
                  {e.series && <span className="text-muted">{e.series}</span>}
                </div>
                <h2 className="mt-2.5 font-serif text-xl leading-tight text-foreground group-hover:text-gold-soft">
                  {e.post.title}
                </h2>
                {e.post.excerpt && (
                  <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">
                    {e.post.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="mt-10 text-sm text-muted">
        Looking for something we haven&rsquo;t covered on camera?{" "}
        <Link href="/articles" className="text-gold hover:underline">
          Browse the journal
        </Link>{" "}
        or{" "}
        <Link href="/search" className="text-gold hover:underline">
          search every bag we track
        </Link>
        .
      </p>
    </main>
  );
}
