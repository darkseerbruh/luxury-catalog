"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { followBrand, unfollowBrand } from "@/lib/brand-follow-actions";

/**
 * The Follow control on the brand "artist header". Renders nothing until the
 * backing table exists (`available` is false pre-migration), so it reveals
 * automatically rather than showing a broken or fake button. Signed-out visitors
 * get a sign-in nudge; the follower count shows only when it is real and gated.
 */
export default function BrandFollow({
  brandId,
  available,
  signedIn,
  initialFollowing,
  count,
}: {
  brandId: number;
  available: boolean;
  signedIn: boolean;
  initialFollowing: boolean;
  count: number | null;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!available) return null;

  function onClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = following ? await unfollowBrand(brandId) : await followBrand(brandId);
      if (res.ok) setFollowing(!following);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={following}
        className={`rounded-full border px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          following
            ? "border-gold bg-gold/10 text-gold"
            : "border-gold text-gold-soft hover:bg-gold/10"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
      {count != null && (
        <span className="text-sm text-muted">
          {count.toLocaleString()} {count === 1 ? "follows" : "follow"} this house
        </span>
      )}
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
