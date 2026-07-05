/**
 * Social search keys — the router between short-form video CTAs and articles,
 * and the data behind the per-platform bio-hub grids.
 *
 * Video CTAs say "search <key> on luxurycatalog.com" instead of "link in bio":
 * TikTok captions aren't clickable, and a link-in-bio page stops working once
 * articles ship weekly. This registry makes the spoken CTA deterministic — an
 * exact key match pins its article to the top of /search — AND drives the grid
 * on /social/tiktok and /social/instagram.
 *
 * PER-PLATFORM MODEL (owner call 2026-07-03: TikTok is the active channel and
 * will diverge from Instagram). Each entry can place itself differently per
 * platform: its own order, its own cover, or absent entirely.
 *  - `platforms` omitted  -> the post is on BOTH grids, in registry order.
 *  - `platforms: { tiktok: {...} }` -> ONLY on TikTok (Instagram skips it).
 *  - per-platform `order` floats a post up its grid (lower = shown first);
 *    entries without an explicit order follow in registry order.
 *  - per-platform `cover` overrides the shared `cover` for that grid.
 * The spoken-key search pin (matchSocialKey) stays platform-agnostic: a key
 * pins its article on /search no matter which app the viewer came from.
 *
 * Rules for a key (enforced by social-search-keys.test.ts):
 * - lowercase; 1-3 words; letters, digits and spaces only — it has to survive
 *   being spoken aloud and typed back from memory;
 * - unique across the registry;
 * - assigned when the content kit is drafted, and verified against /search
 *   before the video is recorded (see docs/social-routing.md).
 */

export type Platform = "tiktok" | "instagram";

export interface PlatformPlacement {
  /** Sort position on this platform's grid; lower = shown first (newest).
   * Omit to keep registry order after any explicitly-ordered entries. */
  order?: number;
  /** Cover frame for THIS platform's tile (owner-recorded footage only),
   * served from /public/social-covers/. Overrides the shared `cover`. */
  cover?: string;
}

export interface SocialKeyEntry {
  /** The spoken key, exactly as said in the video. */
  key: string;
  /** Target article: /articles/<slug>. Must match the published slug. */
  slug: string;
  /** Optional series label, e.g. "10-video LV series". */
  series?: string;
  /** Shared cover frame (both grids) unless a platform overrides it. */
  cover?: string;
  /** Per-platform placement. Omit for "on both grids, registry order". */
  platforms?: Partial<Record<Platform, PlatformPlacement>>;
}

export const SOCIAL_KEYS: SocialKeyEntry[] = [
  {
    key: "coach bags",
    slug: "coach-honest-wedge",
    series: "The Coach wedge kit",
  },
  {
    key: "goyard bags",
    slug: "goyard-whole-house-guide",
    series: "The Goyard house kit",
  },
  {
    key: "luxury diaper bags",
    slug: "luxury-diaper-bags-honestly-ranked",
    series: "The diaper-bag kit",
  },
  {
    key: "lv nine",
    slug: "lv-bags-nobody-talks-about",
    series: "The LV gap series",
  },
  {
    key: "chanel 2026",
    slug: "chanel-in-2026-explained",
  },
  {
    // Founder story / About page. A key so founder-persona posts can close on
    // "search the founder on luxurycatalog.com" and route here. The /about page
    // isn't an article, so the /search pin no-ops until a matching article slug
    // exists — the entry is safe either way (getBySlug returns null for an
    // unknown slug) and keeps the founder key reserved + unique.
    key: "the founder",
    slug: "about",
  },
];

/** A registry entry resolved for one grid: the effective cover picked, series
 * kept, platform machinery stripped. */
export interface ResolvedTile {
  key: string;
  slug: string;
  series?: string;
  cover?: string;
}

/**
 * Pure resolver (unit-tested): the tiles for one platform's grid from a given
 * entry list, in that platform's order. Pass no platform for the generic
 * fallback (every entry, registry order, shared cover). An entry is on a
 * platform's grid when it has no `platforms` block (shared) or when that
 * platform appears in its block. Explicitly-ordered entries sort first
 * (ascending), the rest follow registry order.
 */
export function resolveTiles(
  entries: SocialKeyEntry[],
  platform?: Platform,
): ResolvedTile[] {
  const withIndex = entries.map((entry, index) => ({ entry, index }));

  const included = platform
    ? withIndex.filter(
        ({ entry }) => !entry.platforms || platform in entry.platforms,
      )
    : withIndex;

  const sorted = [...included].sort((a, b) => {
    const ao = platform ? a.entry.platforms?.[platform]?.order : undefined;
    const bo = platform ? b.entry.platforms?.[platform]?.order : undefined;
    if (ao != null && bo != null) return ao - bo || a.index - b.index;
    if (ao != null) return -1;
    if (bo != null) return 1;
    return a.index - b.index;
  });

  return sorted.map(({ entry }) => ({
    key: entry.key,
    slug: entry.slug,
    series: entry.series,
    cover: (platform && entry.platforms?.[platform]?.cover) || entry.cover,
  }));
}

/** The tiles for one platform's grid from the live registry. */
export function keysForPlatform(platform?: Platform): ResolvedTile[] {
  return resolveTiles(SOCIAL_KEYS, platform);
}

/** Lowercase, strip punctuation, collapse whitespace — what a viewer's typed
 * version of a spoken key normalizes to. */
export function normalizeSearchKey(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Exact match of a search query against the registry, or null. Platform-
 * agnostic: a spoken key pins its article regardless of source app. */
export function matchSocialKey(query: string): SocialKeyEntry | null {
  const q = normalizeSearchKey(query);
  if (!q) return null;
  return SOCIAL_KEYS.find((e) => e.key === q) ?? null;
}
