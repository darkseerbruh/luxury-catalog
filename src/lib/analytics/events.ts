/**
 * The single instrumentation entry point for the app.
 *
 * Every deliberate "value/intent" event flows through `track()` so the event
 * taxonomy stays small, typed and discoverable. Autocapture handles everything
 * else automatically, which is what keeps the analytics self-correcting as new
 * UI ships — you only add code here for events that carry business meaning.
 *
 * Naming convention: object_action, snake_case, past tense.
 */
import { isAnalyticsEnabled } from "./config";
import { posthog } from "./posthog";

/** Tier-1 value / intent events. These are the candidate monetization signals. */
export const EVENTS = {
  /** A brand/tier/silhouette/material/size filter was applied. */
  catalogFiltered: "catalog_filtered",
  /** A search was executed (include `result_count`). */
  searchPerformed: "search_performed",
  /** A search returned zero results — a product-gap signal. */
  searchNotFound: "search_not_found",
  /** A style detail page was opened. */
  styleViewed: "style_viewed",
  /** A variant detail page was opened. */
  variantViewed: "variant_viewed",
  /** An authentication section (serial tag, provenance, lock & key) was expanded. */
  authSectionEngaged: "auth_section_engaged",
  /** The price-history chart was viewed or interacted with. */
  priceHistoryViewed: "price_history_viewed",
  /** A click out to an external resale platform — an affiliate-revenue proxy. */
  outboundResaleClicked: "outbound_resale_clicked",
  /** User feedback was submitted. */
  feedbackSubmitted: "feedback_submitted",
  /** A contact/inquiry/lead form was submitted — a lead-revenue proxy. */
  inquirySubmitted: "inquiry_submitted",
  /** An item was saved/favorited. */
  itemSaved: "item_saved",
  /** A fake-door / premium CTA was clicked — a direct willingness-to-pay signal. */
  monetizationInterest: "monetization_interest",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Standard property bundle. Attach whichever fields are in context for the
 * event. Adding a field here documents it once for every call site.
 */
export interface CatalogEventProperties {
  brand?: string;
  brand_tier?: "thrift" | "mid" | "ultra-luxury";
  style?: string;
  silhouette?: string;
  material_category?: string;
  size_category?: string;
  confidence_level?: "low" | "medium" | "high" | "verified";
  // Free-form extras (e.g. result_count, platform, filter values).
  [key: string]: string | number | boolean | null | undefined;
}

/** Capture a Tier-1 value event. No-ops on the server and before setup. */
export function track(
  event: EventName,
  properties: CatalogEventProperties = {},
): void {
  if (typeof window === "undefined" || !isAnalyticsEnabled) return;
  posthog.capture(event, properties);
}

/**
 * Associate the current visitor with a known user id (Tier-2 / post-auth only).
 * No-op unless the visitor has opted into the enhanced layer.
 */
export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !isAnalyticsEnabled) return;
  posthog.identify(distinctId, properties);
}

/** Clear identity on sign-out. */
export function resetAnalytics(): void {
  if (typeof window === "undefined" || !isAnalyticsEnabled) return;
  posthog.reset();
}
