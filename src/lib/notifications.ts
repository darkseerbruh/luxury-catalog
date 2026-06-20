import { createServerSupabase } from "./supabase/server";
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
