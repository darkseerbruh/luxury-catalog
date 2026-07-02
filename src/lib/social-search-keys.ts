/**
 * Social search keys — the router between short-form video CTAs and articles.
 *
 * Video CTAs say "search <key> on luxurycatalog.com" instead of "link in bio":
 * TikTok captions aren't clickable, and a link-in-bio page stops working once
 * articles ship weekly. This registry makes the spoken CTA deterministic — an
 * exact key match pins its article to the top of /search, and /social (the
 * permanent bio-link hub) lists the same entries newest-first.
 *
 * Rules for a key (enforced by social-search-keys.test.ts):
 * - lowercase; 1-3 words; letters, digits and spaces only — it has to survive
 *   being spoken aloud and typed back from memory;
 * - unique across the registry;
 * - assigned when the content kit is drafted, and verified against /search
 *   before the video is recorded (see docs/social-routing.md).
 *
 * Newest posting first — /social renders in this order.
 */

export interface SocialKeyEntry {
  /** The spoken key, exactly as said in the video. */
  key: string;
  /** Target article: /articles/<slug>. Must match the published slug. */
  slug: string;
  /** Optional series label shown on /social, e.g. "10-video LV series". */
  series?: string;
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
];

/** Lowercase, strip punctuation, collapse whitespace — what a viewer's typed
 * version of a spoken key normalizes to. */
export function normalizeSearchKey(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Exact match of a search query against the registry, or null. */
export function matchSocialKey(query: string): SocialKeyEntry | null {
  const q = normalizeSearchKey(query);
  if (!q) return null;
  return SOCIAL_KEYS.find((e) => e.key === q) ?? null;
}
