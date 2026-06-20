/**
 * YouTube helpers for the embedded-resource layer. Embedding (not hosting) is
 * how we add a visual layer while v1 stays text-first with no photos. Uses the
 * privacy-enhanced youtube-nocookie domain.
 */

/** Extracts a video ID from the common YouTube URL shapes (or returns null). */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/, // watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/ID
    /\/embed\/([a-zA-Z0-9_-]{11})/, // /embed/ID
    /\/shorts\/([a-zA-Z0-9_-]{11})/, // /shorts/ID
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  // bare 11-char id
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}
