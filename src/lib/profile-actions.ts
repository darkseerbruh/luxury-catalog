"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

const PERSONAS = [
  "collector",
  "flipper",
  "first-purchase",
  "authentication",
  "thrift-hunter",
] as const;

/** Saves the onboarding answers (persona + display name) and marks the profile onboarded. */
export async function completeOnboarding(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const personaRaw = String(formData.get("persona") ?? "");
  const persona = (PERSONAS as readonly string[]).includes(personaRaw) ? personaRaw : null;
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 80) || null;

  const supabase = await createServerSupabase();
  await supabase
    .from("profile")
    .upsert(
      { id: user.id, persona, display_name: displayName, onboarded: true },
      { onConflict: "id" }
    );

  revalidatePath("/", "layout");
  redirect("/closet");
}
