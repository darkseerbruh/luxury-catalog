"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { isAxis } from "./votes";

export interface VoteResult {
  ok: boolean;
  error?: string;
}

/**
 * Cast or update the current user's vote on one axis of a bag (one vote per
 * user, per bag, per axis — upsert on the 0012 unique constraint). Mirrors the
 * submitReview action + auth + revalidate pattern.
 */
export async function castAxisVote(input: {
  variantId: number;
  axis: string;
  value: number;
}): Promise<VoteResult> {
  if (!Number.isInteger(input.variantId) || input.variantId <= 0) {
    return { ok: false, error: "Invalid item." };
  }
  if (!isAxis(input.axis)) {
    return { ok: false, error: "Invalid axis." };
  }
  if (!Number.isInteger(input.value) || input.value < 1 || input.value > 5) {
    return { ok: false, error: "Please choose a value from 1 to 5." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to vote." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("bag_axis_vote").upsert(
    {
      user_id: user.id,
      variant_id: input.variantId,
      axis: input.axis,
      value: input.value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,variant_id,axis" }
  );

  if (error) {
    console.error("castAxisVote error:", error);
    return { ok: false, error: "Could not save your vote. Please try again." };
  }

  revalidatePath(`/bag/${input.variantId}`);
  return { ok: true };
}

/** Clear the current user's vote on one axis of a bag. */
export async function clearAxisVote(variantId: number, axis: string): Promise<VoteResult> {
  if (!Number.isInteger(variantId) || variantId <= 0) return { ok: false, error: "Invalid item." };
  if (!isAxis(axis)) return { ok: false, error: "Invalid axis." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("bag_axis_vote")
    .delete()
    .eq("user_id", user.id)
    .eq("variant_id", variantId)
    .eq("axis", axis);

  if (error) return { ok: false, error: "Could not clear your vote. Please try again." };
  revalidatePath(`/bag/${variantId}`);
  return { ok: true };
}
