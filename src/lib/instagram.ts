/**
 * Instagram helpers for the embedded-resource layer (sibling of youtube.ts).
 *
 * Embedding (not hosting) is how we add a visual layer while v1 stays text-first
 * with no photos. Instagram posts are rendered via the OFFICIAL authenticated
 * Meta oEmbed Read API — the unauthenticated endpoint was removed in April 2025,
 * so a registered Meta app + access token + business verification is required.
 * See docs/social-embed-strategy.md.
 *
 * The token is SERVER-ONLY and must never reach the browser. getInstagramOEmbed
 * is therefore a server-side fetch (cached) and degrades gracefully to an
 * attribution link-out when the token is missing or the call fails.
 */

const GRAPH_VERSION = "v21.0";
const OEMBED_REVALIDATE_SECONDS = 60 * 60 * 24 * 7; // 7 days — oEmbed HTML is stable

/** Canonical Instagram post shortcodes from the common URL shapes (or null). */
export function instagramShortcode(url: string | null | undefined): string | null {
  if (!url) return null;
  // /p/<code>/ (posts), /reel/<code>/ (reels), /tv/<code>/ (IGTV)
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  return null;
}

/** Normalizes any post URL to the canonical https://www.instagram.com/p/<code>/ form. */
export function instagramPermalink(url: string): string | null {
  const code = instagramShortcode(url);
  return code ? `https://www.instagram.com/p/${code}/` : null;
}

/** Server-only app/client access token for the Meta oEmbed Read API. */
function oembedToken(): string | null {
  if (process.env.META_OEMBED_TOKEN) return process.env.META_OEMBED_TOKEN;
  if (process.env.META_APP_ID && process.env.META_APP_SECRET) {
    return `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`;
  }
  return null;
}

export interface InstagramOEmbed {
  html: string;
  thumbnailUrl: string | null;
  authorName: string | null;
}

/**
 * Fetches the official Meta oEmbed Read payload for a public Instagram post.
 * SERVER-ONLY (uses the secret token). Cached for a week via the Next fetch
 * cache. Returns null when the token is absent or the call fails, so callers
 * fall back to an attribution link-out rather than crashing.
 */
export async function getInstagramOEmbed(
  postUrl: string
): Promise<InstagramOEmbed | null> {
  const permalink = instagramPermalink(postUrl);
  const token = oembedToken();
  if (!permalink || !token) return null;

  const endpoint =
    `https://graph.facebook.com/${GRAPH_VERSION}/instagram_oembed` +
    `?url=${encodeURIComponent(permalink)}` +
    `&omitscript=true&hidecaption=false&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: OEMBED_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      html?: string;
      thumbnail_url?: string;
      author_name?: string;
    };
    if (!data.html) return null;
    return {
      html: data.html,
      thumbnailUrl: data.thumbnail_url ?? null,
      authorName: data.author_name ?? null,
    };
  } catch {
    return null;
  }
}
