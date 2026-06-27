"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import type { ActionResult } from "./collection-actions";

function validBrand(id: unknown): id is number {
  return Number.isInteger(id) && (id as number) > 0;
}

/** Friendlier message when the action runs before migration 0032 is applied. */
function messageFor(error: { message?: string }): string {
  if (error.message && /does not exist|schema cache/i.test(error.message)) {
    return "Following isn't available just yet. Check back soon.";
  }
  return "Something went wrong. Please try again.";
}

/** Follow a house. Needs migration 0032 (`brand_follow`); degrades with a clear message. */
export async function followBrand(brandId: number): Promise<ActionResult> {
  if (!validBrand(brandId)) return { ok: false, error: "Invalid brand." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to follow." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("brand_follow")
    .upsert({ user_id: user.id, brand_id: brandId }, { onConflict: "user_id,brand_id" });

  if (error) return { ok: false, error: messageFor(error) };
  revalidatePath(`/brand/${brandId}`);
  return { ok: true };
}

export async function unfollowBrand(brandId: number): Promise<ActionResult> {
  if (!validBrand(brandId)) return { ok: false, error: "Invalid brand." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("brand_follow")
    .delete()
    .eq("user_id", user.id)
    .eq("brand_id", brandId);

  if (error) return { ok: false, error: messageFor(error) };
  revalidatePath(`/brand/${brandId}`);
  return { ok: true };
}
