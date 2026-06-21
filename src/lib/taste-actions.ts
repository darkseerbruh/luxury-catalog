"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import {
  buildVectorFromAnswers,
  completeness as computeCompleteness,
} from "./taste";

export interface SaveQuizResult {
  ok: boolean;
  error?: string;
  completeness?: number;
}

/**
 * Persist quiz answers as a taste vector on the profile. `answers` maps
 * question id -> chosen option value. We rebuild the vector server-side from the
 * canonical question definitions so weights are trustworthy and only reference
 * catalogued attributes.
 */
export async function saveQuizAnswers(answers: Record<string, string>): Promise<SaveQuizResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to save your taste profile." };

  const vector = buildVectorFromAnswers(answers);

  if (Object.keys(vector).length === 0) {
    return { ok: false, error: "No answers recorded." };
  }

  const tasteCompleteness = computeCompleteness(vector);

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("profile")
    .upsert(
      { id: user.id, taste_vector: vector, taste_completeness: tasteCompleteness },
      { onConflict: "id" }
    );

  if (error) return { ok: false, error: "Could not save your taste profile. Please try again." };

  revalidatePath("/profile");
  revalidatePath("/quiz");
  revalidatePath("/");
  return { ok: true, completeness: tasteCompleteness };
}
