"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { safeNext } from "./safe-next";

const PERSONAS = [
  "collector",
  "flipper",
  "first-purchase",
  "authentication",
  "thrift-hunter",
] as const;

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

/** Saves the onboarding answers (username + persona + display name) and marks the profile onboarded. */
export async function completeOnboarding(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const personaRaw = String(formData.get("persona") ?? "");
  const persona = (PERSONAS as readonly string[]).includes(personaRaw) ? personaRaw : null;
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 80) || null;
  const handle = normalizeHandle(String(formData.get("handle") ?? ""));

  const supabase = await createServerSupabase();
  await supabase
    .from("profile")
    .upsert(
      { id: user.id, persona, display_name: displayName, onboarded: true },
      { onConflict: "id" }
    );

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
