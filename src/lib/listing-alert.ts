/**
 * Availability alerts: "one turned up", regardless of price.
 *
 * The two price-conditioned modes serve a value hunter. This serves a collector,
 * whose trigger is a grail becoming available at all, and who will happily pay
 * over the median to get it (`docs/personas.md`, Persona 3 "Diane").
 *
 * It is a FLOOR, not a mode: it runs under whatever price rule the watcher set,
 * because someone hunting a discontinued colourway wants to hear about it even
 * if they also told us their target price.
 *
 * Pure functions only, so the cron's decisions are unit-testable without a DB.
 */

export interface ListingRow {
  variant_id: number;
  sale_price: number | string | null;
  currency: string | null;
  /** Ingest-stamped observation date (preferred). */
  observed_on: string | null;
  /** Row insert date. Fallback when observed_on was never populated. */
  date_recorded: string | null;
  /** Stable per-listing id. Rows without one can't be deduped, so we skip them. */
  listing_ref: string | null;
  platform: string | null;
}

export interface NewListing {
  price: number | null;
  currency: string | null;
  platform: string | null;
  listingRef: string;
  seenOn: string;
  /** How many distinct listings appeared since the cutoff, this one included. */
  alsoCount: number;
}

/** The date we treat a listing as having appeared on. */
export function listingDate(row: ListingRow): string | null {
  return row.observed_on ?? row.date_recorded ?? null;
}

function toPrice(v: number | string | null): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Pick the listing to tell this watcher about, or null.
 *
 * `since` is the watcher's own cutoff: the last time we sent them an
 * availability ping, or failing that when they started watching. Anything at or
 * before it, they have already had the chance to see, which is what stops a new
 * watch from firing a retroactive flood on day one.
 *
 * Distinct listings are counted by `listing_ref`, so the same listing re-observed
 * on five daily crawls is one listing, not five.
 */
export function pickNewListing(rows: ListingRow[], since: string | null): NewListing | null {
  const cutoff = since ? Date.parse(since) : Number.NaN;
  const firstSeen = new Map<string, { date: string; row: ListingRow }>();

  for (const row of rows) {
    const ref = row.listing_ref;
    // No stable id means we cannot tell a new listing from a re-observation,
    // and a false "it's available!" is worse than staying quiet.
    if (!ref) continue;
    const date = listingDate(row);
    if (!date) continue;
    const ts = Date.parse(date);
    if (!Number.isFinite(ts)) continue;
    // A cutoff we can't parse means "no cutoff", not "everything qualifies":
    // treat it as never-notified and let the caller's `since` fallback decide.
    if (Number.isFinite(cutoff) && ts <= cutoff) continue;

    const prior = firstSeen.get(ref);
    if (!prior || Date.parse(prior.date) > ts) firstSeen.set(ref, { date, row });
  }

  if (firstSeen.size === 0) return null;

  // Surface the most recently surfaced listing; mention the rest by count.
  const entries = [...firstSeen.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const top = entries[0];

  return {
    price: toPrice(top.row.sale_price),
    currency: top.row.currency,
    platform: top.row.platform,
    listingRef: top.row.listing_ref as string,
    seenOn: top.date,
    alsoCount: entries.length,
  };
}

/**
 * The cutoff for a watch: the last availability ping, else when they started
 * watching. Never null in practice, because `created_at` is NOT NULL.
 */
export function watchCutoff(watch: {
  last_listing_notified_at?: string | null;
  created_at?: string | null;
}): string | null {
  return watch.last_listing_notified_at ?? watch.created_at ?? null;
}
