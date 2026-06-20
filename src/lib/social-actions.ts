"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser, getProfile } from "./auth";
import { notifyClosetActivity } from "./notifications";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Follow (favorite) another user's closet. Notifies the owner. */
export async function favoriteCloset(ownerUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to follow closets." };
  if (user.id === ownerUserId) return { ok: false, error: "You can't follow your own closet." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("closet_favorite")
    .upsert(
      { follower_user_id: user.id, owner_user_id: ownerUserId },
      { onConflict: "follower_user_id,owner_user_id" }
    );

  if (error) return { ok: false, error: "Could not follow. Please try again." };

  // Re-engagement: tell the owner someone followed their closet (best-effort).
  const me = await getProfile();
  const who = me?.handle ? `@${me.handle}` : me?.displayName ?? "Someone";
  await notifyClosetActivity(ownerUserId, `${who} started following your closet`, null);

  revalidatePath("/u");
  revalidatePath("/feed");
  return { ok: true };
}

/** Unfollow a closet. */
export async function unfavoriteCloset(ownerUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("closet_favorite")
    .delete()
    .eq("follower_user_id", user.id)
    .eq("owner_user_id", ownerUserId);

  if (error) return { ok: false, error: "Could not unfollow. Please try again." };
  revalidatePath("/u");
  revalidatePath("/feed");
  return { ok: true };
}

const HANDLE_RE = /^[a-z0-9_]{3,30}$/;
const SOCIAL_KEYS = ["instagram", "tiktok", "youtube", "poshmark", "substack", "website"] as const;

function cleanHandleInput(raw: string): string {
  // Accept "@name", a full URL, or a bare handle; store a bare handle/path.
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/\/+$/, "")
    .slice(0, 120);
}

/**
 * Save the social fields of the profile (handle, bio, avatar, closet_public,
 * social links). Used by the profile-edit and onboarding flows.
 */
export async function saveSocialProfile(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const handleRaw = String(formData.get("handle") ?? "").trim().toLowerCase().replace(/^@/, "");
  const handle = handleRaw.length ? handleRaw : null;
  if (handle && !HANDLE_RE.test(handle)) {
    return { ok: false, error: "Handle must be 3–30 lowercase letters, numbers or underscores." };
  }

  const bio = String(formData.get("bio") ?? "").trim().slice(0, 500) || null;
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim().slice(0, 500) || null;
  const closetPublic = formData.get("closet_public") === "on" || formData.get("closet_public") === "true";

  const socialLinks: Record<string, string> = {};
  for (const key of SOCIAL_KEYS) {
    const v = cleanHandleInput(String(formData.get(`social_${key}`) ?? ""));
    if (v) socialLinks[key] = v;
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("profile")
    .upsert(
      {
        id: user.id,
        handle,
        bio,
        avatar_url: avatarUrl,
        closet_public: closetPublic,
        social_links: socialLinks,
      },
      { onConflict: "id" }
    );

  if (error) {
    // Likely a unique-handle collision.
    if (error.code === "23505") return { ok: false, error: "That handle is already taken." };
    return { ok: false, error: "Could not save profile. Please try again." };
  }

  revalidatePath("/profile");
  if (handle) revalidatePath(`/u/${handle}`);
  return { ok: true };
}
