"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import { getSupabaseAdmin } from "./supabase/admin";
import { getCurrentUser } from "./auth";
import type { NotificationPrefs } from "./auth";

export interface SettingsResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * Change the signed-in user's email. Uses the user's own session
 * (`supabase.auth.updateUser`) — NOT the admin client — so it goes through
 * Supabase's confirmation flow (a confirmation email is sent to the new address
 * when "Secure email change" is on).
 */
export async function updateEmail(formData: FormData): Promise<SettingsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (email === user.email) return { ok: false, error: "That's already your email." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return {
    ok: true,
    message:
      "Check your inbox (and the new address) to confirm the change. Your email updates once confirmed.",
  };
}

/** Change the signed-in user's password via their own session. */
export async function updatePassword(formData: FormData): Promise<SettingsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (password !== confirm) return { ok: false, error: "Passwords don't match." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Password updated." };
}

/**
 * Save notification preferences (per-channel opt-outs) onto the profile. A
 * checked box = opted in (true); unchecked = opted out (false). The notification
 * creators read these and respect opt-outs.
 */
export async function updateNotificationPrefs(formData: FormData): Promise<SettingsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const prefs: NotificationPrefs = {
    price_alert: formData.get("pref_price_alert") === "on",
    closet_activity: formData.get("pref_closet_activity") === "on",
    photo_featured: formData.get("pref_photo_featured") === "on",
    email: formData.get("pref_email") === "on",
  };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("profile")
    .upsert({ id: user.id, notification_prefs: prefs }, { onConflict: "id" });

  if (error) {
    // Column may not exist yet (0010 unapplied) — degrade with a clear message.
    return {
      ok: false,
      error: "Could not save preferences. The notification-prefs migration may not be applied yet.",
    };
  }

  revalidatePath("/settings");
  return { ok: true, message: "Preferences saved." };
}

/**
 * Delete the signed-in user's account. Requires the service-role admin client
 * (`auth.admin.deleteUser`); FKs cascade the user's data. Degrades gracefully
 * with a clear message when the service-role key is absent (the cloud build /
 * any env without it). Requires the user to type their email to confirm.
 */
export async function deleteAccount(formData: FormData): Promise<SettingsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const confirmEmail = String(formData.get("confirm_email") ?? "").trim().toLowerCase();
  if (!user.email || confirmEmail !== user.email.toLowerCase()) {
    return { ok: false, error: "Type your exact email to confirm deletion." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error:
        "Account deletion isn't available right now (server not configured). Please contact support to delete your account.",
    };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("deleteAccount error:", error);
      return { ok: false, error: "Could not delete your account. Please contact support." };
    }
  } catch (err) {
    console.error("deleteAccount exception:", err);
    return { ok: false, error: "Could not delete your account. Please contact support." };
  }

  // Clear the now-orphaned session and send them home.
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}
