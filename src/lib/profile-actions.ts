"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { safeNext } from "./safe-next";
import {
  deriveMaturityStage,
  motivationsToPersona,
  sanitizeMotivations,
} from "./maturity";

/** Normalise a chosen username to a safe handle, or null if unusable. */
function normalizeHandle(raw: string): string | null {
  const h = raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
  return h.length >= 3 ? h : null;
}

/**
 * Compute the user's initial maturity stage from their closet at onboarding.
 * New users have an empty closet, so this is usually "appreciate"; the nightly
 * rebuild-profiles cron keeps it current as behavior accumulates.
 */
async function deriveInitialMaturity(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("closet_item")
    .select("status")
    .eq("user_id", userId);
  const rows = data ?? [];
  const owned = rows.filter((r) => r.status === "owned").length;
  const wishlist = rows.length - owned;
  return deriveMaturityStage({ owned, wishlist });
}

/** Saves the onboarding answers (username + motivations + display name) and marks the profile onboarded. */
export async function completeOnboarding(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Persona model v2: capture Axis-B motivations (multi-select). The legacy
  // `persona` enum is kept populated with a best-effort primary so existing
  // readers keep working (see lib/maturity.ts).
  const motivations = sanitizeMotivations(formData.getAll("motivations").map(String));
  const persona = motivationsToPersona(motivations);
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 80) || null;
  const handle = normalizeHandle(String(formData.get("handle") ?? ""));

  const supabase = await createServerSupabase();
  // Core upsert: only columns guaranteed to exist, so onboarding can never be
  // blocked by 0037 not being applied yet.
  await supabase
    .from("profile")
    .upsert(
      { id: user.id, persona, display_name: displayName, onboarded: true },
      { onConflict: "id" }
    );

  // Best-effort: persist the v2 columns. If 0037 is not applied yet the update
  // errors on the missing columns; swallow it so onboarding still completes.
  const maturityStage = await deriveInitialMaturity(supabase, user.id);
  const { error: v2Error } = await supabase
    .from("profile")
    .update({ motivations, maturity_stage: maturityStage })
    .eq("id", user.id);
  if (v2Error) {
    console.warn("completeOnboarding: persona v2 columns not stored (apply 0037):", v2Error.message);
  }

  // Set the chosen username separately and best-effort: a unique-violation (handle
  // taken) must not block onboarding — the user can pick another in /profile/edit.
  if (handle) {
    const { error } = await supabase.from("profile").update({ handle }).eq("id", user.id);
    if (error) {
      revalidatePath("/", "layout");
      redirect("/profile/edit?handle=taken");
    }
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")) ?? "/closet");
}
