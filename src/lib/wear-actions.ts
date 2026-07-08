"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { isCarry, isWeightFeel, FITS_NOTE_MAX } from "./wear-options";

export interface WearResult {
  ok: boolean;
  error?: string;
}

/** Normalize a fits note: trim, collapse to null when empty. */
function cleanNote(note: string | null | undefined): string | null | undefined {
  if (note === undefined) return undefined;
  if (note === null) return null;
  const t = note.trim();
  return t.length ? t : null;
}

/**
 * Set (or clear) the current user's lived wear taps for a bag — carry, weight_feel,
 * and/or a short "what fit inside" note, one row per user per bag (upsert on the
 * 0046 unique constraint). Each field is independent: pass `undefined` to leave a
 * field untouched, or `null`/"" to clear just that field. Mirrors the castAxisVote
 * auth + revalidate pattern; merges against the existing row so one tap never
 * wipes another.
 */
export async function setWear(input: {
  variantId: number;
  carry?: string | null;
  weightFeel?: string | null;
  fitsNote?: string | null;
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
  const cleanedNote = cleanNote(input.fitsNote);
  if (typeof cleanedNote === "string" && cleanedNote.length > FITS_NOTE_MAX) {
    return { ok: false, error: `Keep it under ${FITS_NOTE_MAX} characters.` };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to add yours." };

  const supabase = await createServerSupabase();

  // Read the existing row so an untouched field is preserved on write.
  const { data: existing, error: readErr } = await supabase
    .from("bag_wear")
    .select("carry, weight_feel, fits_note")
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
  const fitsNote = cleanedNote !== undefined ? cleanedNote : (existing?.fits_note ?? null);

  // Everything cleared → remove the row entirely rather than keep an empty one.
  if (carry == null && weightFeel == null && fitsNote == null) {
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
      fits_note: fitsNote,
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
