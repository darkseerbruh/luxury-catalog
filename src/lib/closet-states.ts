/**
 * Closet vocabulary: the shelf states and the reasons a bag left the shelf.
 *
 * In its OWN server-free module for the same reason `axes.ts` is: a `"use server"`
 * file may export async functions exclusively, so `collection-actions.ts` could not
 * export these and the UI kept redefining its own copies. One source of truth now.
 *
 * TRIED (added 0061) fills a real gap: someone who held the bag in a store but never
 * owned it. They are exactly the audience deciding whether to buy, and until now they
 * had no honest way to say anything. Their read on structure, access and dress code
 * is genuine; their read on how it ages is not, which the read layer can weight later.
 *
 * HAD REASONS are behaviour, not sentiment (owner correction, 2026-07-26). "Sold it"
 * was briefly on the emotional scale, which was wrong: selling implies you liked the
 * bag at some point. Kept here, it says far more than a low rating. `rented` matters
 * on its own because a member may have carried a Vivrelle bag for a month and never
 * owned it, and would otherwise be miscounted as a former owner.
 */

export const CLOSET_STATUSES = ["want", "tried", "have", "had"] as const;
export type ClosetStatus = (typeof CLOSET_STATUSES)[number];

export function isClosetStatus(v: unknown): v is ClosetStatus {
  return typeof v === "string" && (CLOSET_STATUSES as readonly string[]).includes(v);
}

export const CLOSET_STATUS_META: Record<ClosetStatus, { chip: string; hint: string }> = {
  want: { chip: "Want it", hint: "On your list." },
  tried: { chip: "Tried it", hint: "Held it in person, never owned it." },
  have: { chip: "Have it", hint: "It is yours now." },
  had: { chip: "Had it", hint: "You do not have it any more." },
};

/** Only meaningful alongside `had`. Optional, so it never gates the status change. */
export const HAD_REASONS = ["sold", "returned", "gifted", "rented", "lost"] as const;
export type HadReason = (typeof HAD_REASONS)[number];

export function isHadReason(v: unknown): v is HadReason {
  return typeof v === "string" && (HAD_REASONS as readonly string[]).includes(v);
}

export const HAD_REASON_META: Record<HadReason, { chip: string }> = {
  sold: { chip: "Sold it" },
  returned: { chip: "Returned it" },
  gifted: { chip: "Gifted it" },
  rented: { chip: "Rented it" },
  lost: { chip: "Lost it" },
};

/**
 * Which states count as having genuinely lived with the bag. Used to weight the
 * longitudinal axes: someone who tried a bag in a boutique can speak to how it
 * opens, but not to how it looks after three years.
 */
export function hasLivedWithIt(status: ClosetStatus | null): boolean {
  return status === "have" || status === "had";
}
