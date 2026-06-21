import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";
import { markAllNotificationsRead } from "@/lib/notification-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notifications · The Luxury Catalog" };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function NotificationsPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const items = await getNotifications();
  const hasUnread = items.some((n) => !n.read);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted">Notifications</p>
          <h1 className="mt-1 font-serif text-3xl text-foreground">Your alerts</h1>
        </div>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              Mark all read
            </button>
          </form>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">No notifications yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Set a target price on a bag in your{" "}
            <Link href="/watchlist" className="text-gold hover:underline">
              watchlist
            </Link>{" "}
            and we&rsquo;ll alert you when the price drops.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((n) => {
            const inner = (
              <div
                className={`rounded-2xl border bg-surface p-5 transition-colors ${
                  n.read ? "border-border" : "border-gold/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{n.title}</p>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />}
                </div>
                {n.body && <p className="mt-1 text-sm text-muted">{n.body}</p>}
                <p className="mt-2 text-xs text-muted">{formatDate(n.createdAt)}</p>
              </div>
            );
            return (
              <li key={n.notificationId}>
                {n.variantId ? (
                  <Link href={`/bag/${n.variantId}`} className="block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
