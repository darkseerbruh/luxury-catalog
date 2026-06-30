/**
 * Revalidate windows (seconds) for cached read queries.
 *
 * The homepage is `force-dynamic` (it reads cookies for the signed-in branch),
 * so without per-query caching every visitor recomputes the whole catalog +
 * resale-market fan-out on every hit. These windows let repeat loads serve warm
 * data from the Next data cache instead. Catalog structure and resale figures
 * change on the order of minutes via data pulls, not per request, so a few
 * minutes of staleness is invisible to the reader and removes the per-hit cost.
 *
 * Wrap a cookieless query (`getSupabase()` anon client) with `unstable_cache`;
 * never wrap anything that reads `cookies`/`headers` or returns per-user data.
 */

/** Catalog structure: brands, hero canon, published journal posts. */
export const CACHE_CATALOG = 600;

/** Resale-market reads: deals + community leaderboards. */
export const CACHE_MARKET = 600;

/** Content-readiness gates (review/coveted thresholds). */
export const CACHE_GATE = 600;
