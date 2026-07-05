"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { notifyFollowersOfActivity } from "./notifications";
import { isOccasion } from "./occasions";

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
  /** Owner-reported structured detail: does this bag have protective feet? (0044) */
  reportsProtectiveFeet?: boolean | null;
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

  const feetReport =
    input.reportsProtectiveFeet === true || input.reportsProtectiveFeet === false
      ? input.reportsProtectiveFeet
      : null;

  const supabase = await createServerSupabase();
  const baseRow = {
    variant_id: input.variantId,
    user_id: user.id,
    rating: input.rating,
    title: input.title?.trim().slice(0, 120) || null,
    body: input.body?.trim().slice(0, 2000) || null,
    worth_it: input.worthIt ?? null,
    // Only the canonical closed set is stored; anything else (incl. legacy free
    // text) is dropped to null so the column stays rankable (occasions.ts).
    occasion: isOccasion(input.occasion) ? input.occasion : null,
    durability_rating: durability,
    updated_at: new Date().toISOString(),
  };

  // Try WITH the 0044 reports_protective_feet column; if it isn't migrated yet the
  // upsert errors on the unknown column — retry WITHOUT it so the review still
  // saves. The owner's feet report is simply dropped until the column exists.
  let error = (
    await supabase
      .from("review")
      .upsert({ ...baseRow, reports_protective_feet: feetReport }, { onConflict: "user_id,variant_id" })
  ).error;
  if (error && /reports_protective_feet/.test(error.message ?? "")) {
    error = (
      await supabase.from("review").upsert(baseRow, { onConflict: "user_id,variant_id" })
    ).error;
  }

  if (error) {
    console.error("submitReview error:", error);
    return { ok: false, error: "Could not save your review. Please try again." };
  }

  // Crowd-fill: promote a confident owner report up to the style attribute, but
  // only when the catalog doesn't already have a documented answer (never
  // overwrite seeded/known data with one review). Best-effort + resilient —
  // any missing column/table is swallowed so it can't fail the review.
  if (feetReport !== null) {
    try {
      const { data: vRow } = await supabase
        .from("variant")
        .select("style:style_id(style_id, has_protective_feet)")
        .eq("variant_id", input.variantId)
        .maybeSingle();
      const style = (vRow as { style?: { style_id: number; has_protective_feet: boolean | null } | { style_id: number; has_protective_feet: boolean | null }[] } | null)?.style;
      const styleRow = Array.isArray(style) ? style[0] : style;
      if (styleRow && styleRow.has_protective_feet == null) {
        await supabase
          .from("style")
          .update({ has_protective_feet: feetReport })
          .eq("style_id", styleRow.style_id)
          .is("has_protective_feet", null);
      }
    } catch {
      // Column/table not there yet — the report stays on the review row only.
    }
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
