"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { isCarry, isWeightFeel } from "./wear-options";

export interface WearResult {
  ok: boolean;
  error?: string;
}

/**
 * Set (or clear) the current user's lived wear taps for a bag — carry and/or
 * weight_feel, one row per user per bag (upsert on the 0046 unique constraint).
 * Each tap is independent: pass `undefined` to leave a field untouched, or
 * `null` to clear just that field. Mirrors the castAxisVote auth + revalidate
 * pattern; merges against the existing row so one tap never wipes the other.
 */
export async function setWear(input: {
  variantId: number;
  carry?: string | null;
  weightFeel?: string | null;
}): Promise<WearResult> {
  if (!Number.isInteger(input.variantId) || input.variantId <= 0) {
    return { ok: false, error: "Invalid item." };
  }
  if (input.carry != null && !isCarry(input.carry)) {
    return { ok: false, error: "Invalid carry option." };
  }
  if (input.weightFeel != null && !isWeightFeel(input.weightFeel)) {
    return { ok: false, error: "Invalid weight option." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to add yours." };

  const supabase = await createServerSupabase();

  // Read the existing row so an untouched field is preserved on write.
  const { data: existing, error: readErr } = await supabase
    .from("bag_wear")
    .select("carry, weight_feel")
    .eq("user_id", user.id)
    .eq("variant_id", input.variantId)
    .maybeSingle();

  if (readErr) {
    console.error("setWear read error:", readErr);
    return { ok: false, error: "Could not save. Please try again." };
  }

  const carry = input.carry !== undefined ? input.carry : (existing?.carry ?? null);
  const weightFeel =
    input.weightFeel !== undefined ? input.weightFeel : (existing?.weight_feel ?? null);

  // Both cleared → remove the row entirely rather than keep an empty one.
  if (carry == null && weightFeel == null) {
    const { error } = await supabase
      .from("bag_wear")
      .delete()
      .eq("user_id", user.id)
      .eq("variant_id", input.variantId);
    if (error) return { ok: false, error: "Could not save. Please try again." };
    revalidatePath(`/bag/${input.variantId}`);
    return { ok: true };
  }

  const { error } = await supabase.from("bag_wear").upsert(
    {
      user_id: user.id,
      variant_id: input.variantId,
      carry,
      weight_feel: weightFeel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,variant_id" }
  );

  if (error) {
    console.error("setWear error:", error);
    return { ok: false, error: "Could not save. Please try again." };
  }

  revalidatePath(`/bag/${input.variantId}`);
  return { ok: true };
}
