"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { resetTasteProfile } from "@/lib/personalization/taste-profile-page";

export async function resetTasteAction() {
  const user = await getCurrentUser();
  if (!user) return;
  await resetTasteProfile(user.id);
  revalidatePath("/taste");
}
