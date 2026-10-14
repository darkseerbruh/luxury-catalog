/**
 * Read-time freshness window for anything the site presents as a LIVE offer
 * (buy links, "available now" counts, JSON-LD offers, the gauge's asking markers).
 *
 * The scheduled live-inventory refresh lanes were retired 2026-10-14 (info-source
 * pivot): listing_status is no longer reconciled against the sources, so a
 * `listed` row's status can't be trusted forever. A row counts as a live offer
 * only while its latest observation is recent enough that the listing is
 * plausibly still for sale; past the window it stays in the catalog as a dated
 * historical price observation (never deleted — history is permanent evidence).
 *
 * 14 days mirrors the age-based retirement the TRR refresh lane used.
 */
export const LIVE_OFFER_WINDOW_DAYS = 14;

/** True when the observation date is inside the live-offer window. */
export function isFreshOffer(observedOn: string | null | undefined, now: Date = new Date()): boolean {
  if (!observedOn) return false;
  const t = Date.parse(observedOn);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= LIVE_OFFER_WINDOW_DAYS * 86_400_000;
}

/** Oldest observed_on (YYYY-MM-DD) still inside the window — for SQL `gte` filters. */
export function liveOfferCutoffISO(now: Date = new Date()): string {
  const d = new Date(now.getTime() - LIVE_OFFER_WINDOW_DAYS * 86_400_000);
  return d.toISOString().slice(0, 10);
}
