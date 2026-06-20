"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

/** Mark all of the current user's notifications as read. */
export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createServerSupabase();
  await supabase.from("notification").update({ read: true }).eq("read", false);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
