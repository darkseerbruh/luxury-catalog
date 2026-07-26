/**
 * The one canvas: everything a member has said about one bag, in a single shape.
 *
 * WHY THIS EXISTS (owner, 2026-07-26). She tried the equivalent on Fragrantica and
 * gave up on it: *"there are so many places to record information about your
 * experience with a fragrance that I never remember where I wrote it down, like, in
 * a review, in a private note, in one of the reading categories."*
 *
 * That is a real failure and it is ours too. Right now a member's relationship with
 * a bag is scattered across `closet_item` (status, note, purchase context),
 * `review` (rating, title, body), `bag_axis_vote` (six scales),
 * `reputation_claim_vote` (agreements) and `bag_photo`. Five tables, and until now
 * no single place that answers "what have I said about this bag?"
 *
 * So this module assembles them into ONE object. It is the data model behind a
 * single panel, and the rule that goes with it: **never add a sixth place to write
 * something about a bag.** New inputs join the canvas or they do not ship.
 *
 * Public and private are marked per field, not per surface, because that is the
 * other half of why the pattern fails elsewhere: people cannot remember which
 * feature was the private one.
 */

import type { ClosetStatus, HadReason } from "./closet-states";
import type { Axis } from "./axes";

export type Visibility = "public" | "private";

/** Which parts of the canvas are visible to anyone else. Single source of truth. */
export const CANVAS_VISIBILITY = {
  status: "public",          // a public closet shows `have` items (0006 privacy rule)
  mostWorn: "public",        // aggregated into "N owners reach for this"
  rating: "public",
  reviewTitle: "public",
  reviewBody: "public",
  axisVotes: "public",       // aggregated, never per-person
  claimVotes: "public",      // aggregated into the tallies
  photos: "public",          // once approved
  note: "private",
  purchaseYear: "private",   // aggregated only, and only for interpreting opinions
  purchaseChannel: "private",
  purchasePrice: "private",  // never aggregated today; see 0067
  hadReason: "private",
} as const satisfies Record<string, Visibility>;

export type CanvasField = keyof typeof CANVAS_VISIBILITY;

export function isPrivate(field: CanvasField): boolean {
  return CANVAS_VISIBILITY[field] === "private";
}

/** Everything one member has recorded about one bag. Any part may be absent. */
export interface BagCanvas {
  variantId: number;

  // Where it sits with them
  status: ClosetStatus | null;
  hadReason: HadReason | null;
  mostWorn: boolean;
  mostWornSetAt: string | null;

  // What they said in public
  rating: number | null;
  reviewTitle: string | null;
  reviewBody: string | null;
  axisVotes: Partial<Record<Axis, number>>;
  claimVotesCast: number;
  photoCount: number;

  // Theirs alone
  note: string | null;
  purchaseYear: number | null;
  purchaseChannel: string | null;
  purchasePrice: number | null;
  purchaseCurrency: string | null;
}

export function emptyCanvas(variantId: number): BagCanvas {
  return {
    variantId,
    status: null,
    hadReason: null,
    mostWorn: false,
    mostWornSetAt: null,
    rating: null,
    reviewTitle: null,
    reviewBody: null,
    axisVotes: {},
    claimVotesCast: 0,
    photoCount: 0,
    note: null,
    purchaseYear: null,
    purchaseChannel: null,
    purchasePrice: null,
    purchaseCurrency: null,
  };
}

/**
 * How much of the canvas is filled in, as a 0-1 fraction.
 *
 * Used for a completeness nudge, and it deliberately counts only what we ASK for.
 * Photos and claim votes are excluded: someone who has written a full review and
 * rated every scale should read as complete without being told to go take pictures.
 *
 * Never start a progress meter at zero (the endowed-progress rule in the UX brief),
 * so having the bag in your closet at all already counts for one step.
 */
export function canvasCompleteness(c: BagCanvas): number {
  const steps = [
    c.status !== null,
    c.rating !== null,
    Boolean(c.reviewBody?.trim()),
    Object.keys(c.axisVotes).length > 0,
    c.purchaseYear !== null,
  ];
  return steps.filter(Boolean).length / steps.length;
}

/**
 * The single next thing worth asking this member for, or null when they are done.
 *
 * One ask at a time, in the order that produces the most useful data soonest: the
 * scales before the essay, because scales aggregate and prose does not, and the
 * purchase year last because it is the least fun to answer.
 */
export function nextAsk(c: BagCanvas): CanvasField | null {
  if (c.status === null) return "status";
  if (c.rating === null) return "rating";
  if (Object.keys(c.axisVotes).length === 0) return "axisVotes";
  if (!c.reviewBody?.trim()) return "reviewBody";
  if (c.purchaseYear === null) return "purchaseYear";
  return null;
}
