/**
 * Shared types for the Phase-1 personalization feature store.
 * All interfaces are the TypeScript mirror of the `user_profile` table.
 */

export type BudgetBand = "entry" | "mid" | "grail" | "mixed";
export type PersonaIntent = "buying" | "selling" | "collecting" | "browsing" | "both";

/** One entry in top_affinities — pre-ranked brand affinities for display. */
export interface AffinityEntry {
  name: string;
  score: number;
}

/** Raw signal counts that drove the profile computation. */
export interface SignalCounts {
  want_count: number;
  have_count: number;
  had_count: number;
  watchlist_count: number;
  review_count: number;
  quiz_completeness: number;
  total_interactions: number;
}

/** Attribute affinity map, keyed by dimension → { value: score }. */
export type AttributeAffinities = Partial<Record<string, Record<string, number>>>;

/**
 * The personalization profile row — the pre-aggregated feature store for one user.
 * Returned by `getUserProfile()` in `user-profile.ts`.
 */
export interface PersonalizationProfile {
  userId: string;
  /** Onboarding persona (from profile.persona). */
  persona: string | null;
  /** Inferred budget band from price signals. */
  budgetBand: BudgetBand | null;
  /** Inferred lifecycle intent from closet-status patterns. */
  intent: PersonaIntent | null;
  /** Top 10 brand affinities by score (pre-ranked). */
  topAffinities: AffinityEntry[];
  /** Full brand → weighted-score map for the Phase-2 ranker. */
  brandAffinities: Record<string, number>;
  /** Dimension → { value: score } attribute affinities. */
  attributeAffinities: AttributeAffinities;
  /** Raw signal counts (cold-start detection, diagnostics). */
  signalCounts: SignalCounts;
  /**
   * Snapshot of the quiz+closet+watchlist TasteVector (same shape as
   * `profile.taste_vector`). Phase 3 adds a dense Voyage embedding alongside.
   */
  tasteVectorSnapshot: Record<string, Record<string, number>> | null;
  computedAt: string | null;
}

/** Signals gathered from the DB before aggregation. */
export interface RawUserSignals {
  persona: string | null;
  tasteVectorSnapshot: Record<string, Record<string, number>> | null;
  tasteCompleteness: number;
  closetItems: ClosetSignal[];
  watchlistItems: WatchlistSignal[];
  reviewCount: number;
}

export interface ClosetSignal {
  variantId: number;
  status: "want" | "have" | "had";
  createdAt: string;
  purchasePrice: number | null;
  retailPrice: number | null;
  brandName: string | null;
  silhouette: string | null;
  sizeCategory: string | null;
  hardwareColor: string | null;
  materialType: string | null;
}

export interface WatchlistSignal {
  variantId: number;
  targetPrice: number | null;
  alertEnabled: boolean;
  createdAt: string;
  brandName: string | null;
}
