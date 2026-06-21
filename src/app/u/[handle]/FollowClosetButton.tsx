"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { favoriteCloset, unfavoriteCloset } from "@/lib/social-actions";
import { track, EVENTS } from "@/lib/analytics/events";

export default function FollowClosetButton({
  ownerUserId,
  initialFollowing,
  signedIn,
}: {
  ownerUserId: string;
  initialFollowing: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <a
        href="/login"
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
      >
        Log in to follow
      </a>
    );
  }

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = following ? await unfavoriteCloset(ownerUserId) : await favoriteCloset(ownerUserId);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      const next = !following;
      setFollowing(next);
      if (next) track(EVENTS.closetFavorited, { owner_user_id: ownerUserId });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={
          following
            ? "rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
            : "rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
        }
      >
        {pending ? "…" : following ? "Following" : "Follow closet"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
