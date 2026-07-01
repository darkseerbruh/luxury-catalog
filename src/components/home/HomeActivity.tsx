"use client";

import Link from "next/link";
import { useAuthState } from "@/components/AuthProvider";
import { useHomeMe } from "@/lib/use-home-me";
import { FeedItem } from "@/components/FeedItem";

/** Activity feed slot — signed-in only, streamed in after the static shell. */
export default function HomeActivity() {
  const { signedIn, ready } = useAuthState();
  const { data } = useHomeMe(signedIn);

  if (!ready || !signedIn) return null;
  const feed = data?.feed ?? [];
  if (feed.length === 0) return null;

  return (
    <section className="border-b border-border px-5 py-12">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl text-foreground">Activity</h2>
        <Link href="/feed" className="text-sm text-muted transition-colors hover:text-gold">
          View all
        </Link>
      </div>
      <ul className="mt-6 flex flex-col gap-2.5">
        {feed.map((e) => (
          <FeedItem key={e.id} event={e} />
        ))}
      </ul>
    </section>
  );
}
