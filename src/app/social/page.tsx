import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listPublished, type PostSummary } from "@/lib/posts";
import { SOCIAL_KEYS } from "@/lib/social-search-keys";
import { SITE_URL } from "@/lib/geo";

/**
 * The permanent bio-link hub, grid-first (the likeshop/NYT pattern, owner ask
 * 2026-07-03): the page mirrors the social grid the visitor just left, so the
 * job is "tap the tile you came from," not reading. Tiles are the videos' own
 * cover frames when present (owner-recorded footage only); until a cover is
 * attached, a designed fallback tile renders with the article title and its
 * spoken search key. Cookieless on purpose; listPublished is the cached anon
 * read, so this stays static like the homepage.
 */

const TITLE = "From our videos · Luxury Catalog";
const DESCRIPTION =
  "The grid from our TikTok, tappable: every video's article in posting order. Or type the key you heard in the video into search and it takes you straight there.";

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

  // Registry order = posting order, newest first, mirroring the profile grid.
  // Entries whose article isn't published yet don't render (no dead tiles).
  const entries = SOCIAL_KEYS.map((e) => ({
    ...e,
    post: bySlug.get(e.slug),
  })).filter((e): e is typeof e & { post: PostSummary } => Boolean(e.post));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
        Luxury Catalog
      </p>
      <h1 className="mt-1 font-serif text-2xl text-foreground sm:text-3xl">
        From our videos
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Tap the one that brought you here. Or type the key you heard:
      </p>

      <form method="GET" action="/search" className="mt-3 flex items-center gap-2">
        <input
          name="q"
          type="search"
          placeholder="e.g. “chanel 2026”"
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-gold px-4 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Search
        </button>
      </form>

      <div className="mt-6">
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
          // The grid the visitor just left: 3 columns, square tiles, posting order.
          <div className="grid grid-cols-3 gap-1.5">
            {entries.map((e) => (
              <Link
                key={e.key}
                href={`/articles/${e.post.slug}`}
                className="group relative block aspect-square overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-gold"
              >
                {e.cover ? (
                  <>
                    <Image
                      src={e.cover}
                      alt={e.post.title}
                      fill
                      sizes="(max-width: 672px) 33vw, 220px"
                      className="object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-5">
                      <span className="line-clamp-2 block rounded-lg border border-gold/50 bg-black/50 px-1.5 py-0.5 text-center text-[9px] uppercase leading-tight tracking-[0.08em] text-gold">
                        {e.key}
                      </span>
                    </span>
                  </>
                ) : (
                  // Fallback tile until the video's own cover frame is attached:
                  // house-styled type tile so the grid reads as a designed set.
                  <span
                    className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-center"
                    style={{ background: "radial-gradient(120% 90% at 50% 0%, #2c2618 0%, #1a1815 60%, #100f0d 100%)" }}
                  >
                    <span className="block h-px w-5 bg-gold/50" />
                    <span className="line-clamp-3 font-serif text-[12px] leading-snug text-gold-soft sm:text-[13px]">
                      {e.post.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 max-w-full rounded-lg border border-gold/40 px-1.5 py-0.5 text-[9px] uppercase leading-tight tracking-[0.08em] text-gold">
                      {e.key}
                    </span>
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-sm text-muted">
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
