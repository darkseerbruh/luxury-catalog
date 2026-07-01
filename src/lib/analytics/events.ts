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
import { capture, identify, reset } from "./posthog";

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
  /**
   * The value module (gauge + verdict) was shown. Carries the `framing` it was
   * shown under (buyer/owner/collector) + comp count, so we can later learn —
   * from real usage — which user type is most common and most monetizable
   * (cross-referenced with the outbound buy/sell click that follows).
   */
  valueModuleViewed: "value_module_viewed",
  /** A click out to an external resale platform — an affiliate-revenue proxy. */
  outboundResaleClicked: "outbound_resale_clicked",
  /** A click out to a consignment/sell platform — the consignor-referral revenue proxy. */
  outboundConsignClicked: "outbound_consign_clicked",
  /** User feedback was submitted. */
  feedbackSubmitted: "feedback_submitted",
  /** A star rating / review was submitted. */
  reviewSubmitted: "review_submitted",
  /** A contact/inquiry/lead form was submitted — a lead-revenue proxy. */
  inquirySubmitted: "inquiry_submitted",
  /** An item was saved/favorited. */
  itemSaved: "item_saved",
  /** A user asked for a missing bag to be added — direct demand / product-gap signal. */
  bagRequested: "bag_requested",
  /** A thrift/estate find was logged — real-world acquisition signal. */
  thriftFindLogged: "thrift_find_logged",
  /** A fake-door / premium CTA was clicked — a direct willingness-to-pay signal. */
  monetizationInterest: "monetization_interest",
  /** The find-your-taste quiz was started. */
  quizStarted: "quiz_started",
  /** The find-your-taste quiz was completed (include `completeness`). */
  quizCompleted: "quiz_completed",
  /** A "bags you might like" recommendation was clicked through. */
  recommendationClicked: "recommendation_clicked",
  /** A closet was favorited / followed. */
  closetFavorited: "closet_favorited",
  /** The Taste Map on the profile was viewed. */
  tasteMapViewed: "taste_map_viewed",
  /** An expert published an editorial post/article. */
  postPublished: "post_published",
  /** A structured catalog correction was submitted. */
  correctionSubmitted: "correction_submitted",
  /** A user submitted a photo of a bag (UGC contribution). */
  photoSubmitted: "photo_submitted",
  /** A user requested professional authentication — a marketplace-demand / lead signal. */
  authenticationRequested: "authentication_requested",
  /** A user raised their hand for the (not-yet-live) authentication service — fake-door demand. */
  authenticationInterest: "authentication_interest",
  /** Experiment exposure — user was assigned to a personalization experiment variant. */
  experimentExposed: "experiment_exposed",
  /** A personalized rec section was viewed (impression, not click). */
  personalizedRecsViewed: "personalized_recs_viewed",
  /** A user subscribed to the newsletter. */
  newsletterSubscribed: "newsletter_subscribed",
  /** The homepage hero search box was engaged (focused or submitted) — the success
   *  metric for the home_headline copy test. Carries `flag`, `variant`, `kind`. */
  homeSearchEngaged: "home_search_engaged",
  /** An editorial article was read — a content-channel engagement + acquisition signal. */
  articleViewed: "article_viewed",
  /** An object-oriented attribute page (leather/silhouette/hardware/era/color) was viewed. */
  attributeObjectViewed: "attribute_object_viewed",
  /** Two or more bags were taken to the side-by-side compare — a decision-intent signal. */
  bagsCompared: "bags_compared",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Standard property bundle. Attach whichever fields are in context for the
 * event. Adding a field here documents it once for every call site.
 */
export interface CatalogEventProperties {
  brand?: string;
  brand_tier?: "thrift" | "mid" | "premium" | "ultra-luxury";
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
  capture(event, properties);
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
  identify(distinctId, properties);
}

/** Clear identity on sign-out. */
export function resetAnalytics(): void {
  if (typeof window === "undefined" || !isAnalyticsEnabled) return;
  reset();
}
