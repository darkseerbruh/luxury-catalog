import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount, getNotifications } from "@/lib/notifications";

/**
 * Per-user session read for the client AuthProvider: signed-in flag, unread
 * badge count, and the recent-notifications preview for the header dropdown.
 * Reads cookies, so it's always dynamic — kept light so the app-wide auth
 * fill-in is cheap. The heavy homepage personalization lives in /api/home/me.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ signedIn: false, unread: 0, notifications: [] });
  }

  const [unread, recent] = await Promise.all([getUnreadCount(), getNotifications(5)]);
  const notifications = recent.map((n) => ({
    id: n.notificationId,
    title: n.title,
    href: n.variantId ? `/bag/${n.variantId}` : "/notifications",
    read: n.read,
  }));

  return NextResponse.json({ signedIn: true, unread, notifications });
}
