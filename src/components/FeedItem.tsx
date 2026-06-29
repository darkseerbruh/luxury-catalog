import Link from "next/link";
import type { FeedEvent } from "@/lib/feed";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const s = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function actorLabel(e: FeedEvent): string {
  return e.actorHandle ? `@${e.actorHandle}` : e.actorName || "A collector";
}

/** A single structured activity-feed line. No free text — composed from data. */
export function FeedItem({ event }: { event: FeedEvent }) {
  const actor = actorLabel(event);
  const actorNode = event.actorHandle ? (
    <Link href={`/u/${event.actorHandle}`} className="text-foreground hover:text-gold">
      {actor}
    </Link>
  ) : (
    <span className="text-foreground">{actor}</span>
  );

  const bagNode =
    event.variantId != null ? (
      <Link href={`/bag/${event.variantId}`} className="font-medium text-gold hover:underline">
        {[event.brandName, event.styleName].filter(Boolean).join(" ") || "a bag"}
      </Link>
    ) : null;

  let body: React.ReactNode;
  switch (event.type) {
    case "closet_add":
      body = <>{actorNode} added {bagNode} to their closet</>;
      break;
    case "review":
      body = (
        <>
          {actorNode} reviewed {bagNode}{" "}
          {event.rating != null && <span className="text-gold">{"★".repeat(event.rating)}</span>}
        </>
      );
      break;
    case "post":
      body = (
        <>
          {actorNode} published{" "}
          {event.postSlug ? (
            <Link href={`/articles/${event.postSlug}`} className="font-medium text-gold hover:underline">
              {event.postTitle}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{event.postTitle}</span>
          )}
        </>
      );
      break;
    case "photo_featured":
      body = <>{actorNode}&rsquo;s photo of {bagNode} was featured</>;
      break;
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface px-5 py-3.5 text-sm">
      <p className="leading-relaxed text-muted">{body}</p>
      <span className="shrink-0 text-xs text-muted">{timeAgo(event.createdAt)}</span>
    </li>
  );
}
