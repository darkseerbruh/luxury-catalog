"use server";

import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { tasteIdentity, type Mark, type Vibe, type Logo } from "./taste-identity";

/** The raw quiz answers sent from the client. */
export interface TasteQuizAnswers {
  occasions?: string[];
  vibe?: Record<string, Mark>;
  logo?: Logo | null;
  carry?: Record<string, Mark>;
  finishes?: Record<string, Mark>;
  hardware?: Record<string, Mark>;
  houses?: Record<string, Mark>;
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /column .* does not exist/i.test(error.message ?? "");
}

/**
 * Save a signed-in user's Style-read result. The feeling read is recomputed
 * server-side from the answers (never trust a client-sent string). No-ops cleanly
 * if the user is signed out or migration 0034 isn't applied yet.
 */
export async function saveTasteResult(quiz: TasteQuizAnswers): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const identity = tasteIdentity({
    vibe: quiz.vibe as Partial<Record<Vibe, Mark>> | undefined,
    logo: quiz.logo ?? null,
    hardware: quiz.hardware,
    finishes: quiz.finishes,
  });

  const supabase = await createServerSupabase();
  const row = { id: user.id, taste_quiz: quiz, taste_identity: identity };
  const { error } = await supabase.from("profile").upsert(row as { id: string }, { onConflict: "id" });

  // Pre-0034: the columns don't exist yet. Degrade silently, don't surface an error.
  if (error && !isMissingColumn(error)) return { ok: false };
  return { ok: !error };
}
