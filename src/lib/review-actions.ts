"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { notifyFollowersOfActivity } from "./notifications";

export interface ReviewResult {
  ok: boolean;
  error?: string;
}

/** Create or update the current user's review for a variant (one per user per bag). */
export async function submitReview(input: {
  variantId: number;
  rating: number;
  title?: string;
  body?: string;
  worthIt?: boolean | null;
  occasion?: string;
  durabilityRating?: number | null;
}): Promise<ReviewResult> {
  if (!Number.isInteger(input.variantId) || input.variantId <= 0) {
    return { ok: false, error: "Invalid item." };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Please choose a rating from 1 to 5." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to write a review." };

  const durability =
    input.durabilityRating != null &&
    Number.isInteger(input.durabilityRating) &&
    input.durabilityRating >= 1 &&
    input.durabilityRating <= 5
      ? input.durabilityRating
      : null;

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("review").upsert(
    {
      variant_id: input.variantId,
      user_id: user.id,
      rating: input.rating,
      title: input.title?.trim().slice(0, 120) || null,
      body: input.body?.trim().slice(0, 2000) || null,
      worth_it: input.worthIt ?? null,
      occasion: input.occasion?.trim().slice(0, 80) || null,
      durability_rating: durability,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,variant_id" }
  );

  if (error) {
    console.error("submitReview error:", error);
    return { ok: false, error: "Could not save your review. Please try again." };
  }

  // Re-engagement: a review is feed-worthy → notify followers (best-effort).
  const { data: prof } = await supabase
    .from("profile")
    .select("handle, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const label = prof?.handle
    ? `@${prof.handle}`
    : (prof?.display_name as string | undefined) ?? "A collector you follow";
  await notifyFollowersOfActivity(user.id, label, "wrote a new review", input.variantId);

  revalidatePath(`/bag/${input.variantId}`);
  revalidatePath("/feed");
  return { ok: true };
}

export async function deleteReview(variantId: number): Promise<ReviewResult> {
  if (!Number.isInteger(variantId) || variantId <= 0) return { ok: false, error: "Invalid item." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("review")
    .delete()
    .eq("user_id", user.id)
    .eq("variant_id", variantId);

  if (error) return { ok: false, error: "Could not delete your review. Please try again." };
  revalidatePath(`/bag/${variantId}`);
  return { ok: true };
}
