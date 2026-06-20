import { createServerSupabase } from "./supabase/server";
import { getSupabaseAdmin } from "./supabase/admin";
import { getCurrentUser } from "./auth";

export interface NotificationItem {
  notificationId: number;
  type: string;
  title: string;
  body: string | null;
  variantId: number | null;
  read: boolean;
  createdAt: string;
}

/** The current user's notifications, newest first. Empty when signed out. */
export async function getNotifications(limit = 50): Promise<NotificationItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("notification")
    .select("notification_id, type, title, body, variant_id, read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((n) => ({
    notificationId: n.notification_id,
    type: n.type,
    title: n.title,
    body: n.body,
    variantId: n.variant_id,
    read: n.read,
    createdAt: n.created_at,
  }));
}

/** Count of unread notifications for the header badge. 0 when signed out. */
export async function getUnreadCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("notification")
    .select("notification_id", { count: "exact", head: true })
    .eq("read", false);

  return count ?? 0;
}

/**
 * Insert a notification for ANOTHER user (you can't write to someone else's
 * notification row under RLS, so this uses the service-role client). Used for
 * re-engagement events: "new activity from a closet you follow" and "your photo
 * was featured". Best-effort and silent: never blocks the triggering action,
 * and no-ops when the service-role key isn't configured.
 */
async function insertNotificationFor(
  userId: string,
  type: "closet_activity" | "photo_featured",
  title: string,
  body: string | null,
  variantId: number | null
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    await getSupabaseAdmin()
      .from("notification")
      .insert({ user_id: userId, type, title, body, variant_id: variantId });
  } catch (err) {
    // notification_type enum may not yet include the new values (0007 not
    // applied) — degrade silently rather than failing the social action.
    console.error("notify insert error:", err);
  }
}

/** "New activity from a closet you follow" / "started following you". */
export async function notifyClosetActivity(
  userId: string,
  title: string,
  variantId: number | null
): Promise<void> {
  await insertNotificationFor(userId, "closet_activity", title, null, variantId);
}

/** "Your photo was featured". */
export async function notifyPhotoFeatured(
  userId: string,
  title: string,
  variantId: number | null
): Promise<void> {
  await insertNotificationFor(userId, "photo_featured", title, null, variantId);
}

/**
 * Fan out a "new activity from a closet you follow" notification to everyone who
 * favorites `actorUserId`. Best-effort; uses the service-role client (a user
 * can't write to their followers' notification rows under RLS). No-ops without
 * the service-role key. Capped to avoid runaway fan-out.
 */
export async function notifyFollowersOfActivity(
  actorUserId: string,
  actorLabel: string,
  verb: string,
  variantId: number | null
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("closet_favorite")
      .select("follower_user_id")
      .eq("owner_user_id", actorUserId)
      .limit(500);
    const followers = (data ?? []).map((r) => r.follower_user_id as string);
    if (followers.length === 0) return;

    const title = `${actorLabel} ${verb}`;
    const rows = followers.map((uid) => ({
      user_id: uid,
      type: "closet_activity" as const,
      title,
      body: null,
      variant_id: variantId,
    }));
    await admin.from("notification").insert(rows);
  } catch (err) {
    console.error("notifyFollowersOfActivity error:", err);
  }
}
