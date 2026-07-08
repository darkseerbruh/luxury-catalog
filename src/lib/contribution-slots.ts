import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getReviews } from "@/lib/reviews";
import { getAxisVotes } from "@/lib/votes";

/**
 * The contribution-slots model for a bag: a gap-aware view of what the current
 * user has already given us about this exact bag, and what is still open.
 *
 * One shared idea, two fillers (see docs/ux/review-data-leaderboards.md): the
 * same slots are filled first by Arielle (in-hand capture) and then by anyone
 * who has carried the bag. This layer only READS existing storage — reviews,
 * axis votes, and photo contributions already exist. It adds no schema: it is
 * the conversion surface that pulls people into the controls they scroll past.
 *
 * Slots with no storage yet (carry, weight-feel, what-fit, measured dimensions)
 * are deliberately absent until their migration lands. Never invent a slot that
 * has nowhere to write.
 */
export interface ContributionSlot {
  key: "photo" | "review" | "wears";
  /** Short chip label — the ask. */
  label: string;
  /** One line saying what it is, in her voice. No jargon. */
  hint: string;
  /** In-page anchor to the existing control. */
  anchor: string;
  filled: boolean;
  /** Optional sub-progress, e.g. axis bars rated 2 of 5. */
  sub?: { done: number; total: number };
}

export interface ContributionSlotState {
  signedIn: boolean;
  slots: ContributionSlot[];
  /** Count of filled slots. */
  filled: number;
  /** Total slots offered. */
  total: number;
  /** True once every slot is filled — the surface then thanks and steps back. */
  complete: boolean;
}

/**
 * Read the current user's contribution state for one bag variant. Resilient by
 * design: any single read failing leaves that slot simply "open", never errors
 * the page.
 */
export async function getContributionSlots(variantId: number): Promise<ContributionSlotState> {
  const user = await getCurrentUser();

  // Signed-out: every slot is open, the invitation still shows (login-gated).
  if (!user) {
    const slots = buildSlots({ hasPhoto: false, hasReview: false, axisDone: 0, axisTotal: 5 });
    return { signedIn: false, slots, filled: 0, total: slots.length, complete: false };
  }

  const [reviews, votes, hasPhoto] = await Promise.all([
    getReviews(variantId).catch(() => null),
    getAxisVotes(variantId).catch(() => null),
    userHasPhoto(variantId, user.id).catch(() => false),
  ]);

  const hasReview = !!reviews?.myReview;
  const axisTotal = votes?.axes.length ?? 5;
  const axisDone = votes?.axes.filter((a) => a.myValue != null).length ?? 0;

  const slots = buildSlots({ hasPhoto, hasReview, axisDone, axisTotal });
  const filled = slots.filter((s) => s.filled).length;
  return {
    signedIn: true,
    slots,
    filled,
    total: slots.length,
    complete: filled === slots.length,
  };
}

/**
 * Pure slot definitions from a user's raw contribution facts. Exported for tests:
 * the ordering, labels, anchors, and "filled" rules are the contract the UI and
 * the progress count both depend on.
 */
export function buildSlots(input: {
  hasPhoto: boolean;
  hasReview: boolean;
  axisDone: number;
  axisTotal: number;
}): ContributionSlot[] {
  return [
    {
      key: "photo",
      label: "Add a photo",
      hint: "Even one. Interior, hardware, or on your shoulder.",
      anchor: "#photos",
      filled: input.hasPhoto,
    },
    {
      key: "review",
      label: "Rate it",
      hint: "Stars, and whether it was worth it to you.",
      anchor: "#reviews",
      filled: input.hasReview,
    },
    {
      key: "wears",
      label: "Rate how it wears",
      hint: "Tap the bars: comfort, everyday, build.",
      anchor: "#owner-ratings",
      // The bars slot counts as filled once you have rated at least one axis.
      filled: input.axisDone > 0,
      sub: { done: input.axisDone, total: input.axisTotal },
    },
  ];
}

/** Does this user already have a photo (any non-rejected status) for this bag? */
async function userHasPhoto(variantId: number, userId: string): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("bag_photo")
    .select("photo_id")
    .eq("variant_id", variantId)
    .eq("user_id", userId)
    .neq("status", "rejected")
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}
