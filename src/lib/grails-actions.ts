"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser, getProfile } from "./auth";
import { MAX_GRAILS } from "./grails";

export interface GrailResult {
  ok: boolean;
  error?: string;
}

/**
 * Replace the current user's entire grail set with an ordered list of up to four
 * variant ids (slot 1..N follows array order). This is the single
 * set/reorder/clear entry point: deleting all rows then re-inserting the chosen
 * ones keeps positions contiguous and unique without juggling per-slot upserts.
 * Mirrors the action + auth + revalidate pattern of review-actions.ts.
 */
export async function setFourGrails(variantIds: number[]): Promise<GrailResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to set your grails." };

  // Sanitise: integers only, de-duplicated (preserving order), capped at four.
  const seen = new Set<number>();
  const clean: number[] = [];
  for (const raw of variantIds) {
    const id = Number(raw);
    if (Number.isInteger(id) && id > 0 && !seen.has(id)) {
      seen.add(id);
      clean.push(id);
    }
    if (clean.length >= MAX_GRAILS) break;
  }

  const supabase = await createServerSupabase();

  // Clear first — also handles "clear all" when clean is empty.
  const { error: delError } = await supabase.from("four_grails").delete().eq("user_id", user.id);
  if (delError) {
    console.error("setFourGrails delete error:", delError);
    return { ok: false, error: "Could not update your grails. Please try again." };
  }

  if (clean.length > 0) {
    const rows = clean.map((variant_id, i) => ({
      user_id: user.id,
      variant_id,
      position: i + 1,
    }));
    const { error: insError } = await supabase.from("four_grails").insert(rows);
    if (insError) {
      console.error("setFourGrails insert error:", insError);
      return { ok: false, error: "Could not save your grails. Please try again." };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  const prof = await getProfile();
  if (prof?.handle) revalidatePath(`/u/${prof.handle}`);
  return { ok: true };
}

/** Clear every grail for the current user. */
export async function clearFourGrails(): Promise<GrailResult> {
  return setFourGrails([]);
}
