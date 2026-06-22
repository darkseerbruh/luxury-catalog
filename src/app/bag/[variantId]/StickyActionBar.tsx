"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  saveToCloset,
  removeFromCloset,
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/collection-actions";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Mobile-first sticky bottom action bar (thumb zone) with the decision-point
 * CTAs: Save (closet), Watch (price), Buy (scroll to Where-to-buy), Sell (scroll
 * to Where-to-sell). Reuses the same server actions as the detailed BagActions
 * section so state is consistent; the in-page jumps keep the long page navigable.
 */
export default function StickyActionBar({
  variantId,
  signedIn,
  initialClosetStatus,
  initialWatching,
}: {
  variantId: number;
  signedIn: boolean;
  initialClosetStatus: string | null;
  initialWatching: boolean;
}) {
  const [saved, setSaved] = useState<boolean>(initialClosetStatus === "want" || initialClosetStatus === "have");
  const [watching, setWatching] = useState(initialWatching);
  const [pending, startTransition] = useTransition();

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleSave() {
    if (!signedIn) return;
    startTransition(async () => {
      if (saved) {
        const res = await removeFromCloset(variantId);
        if (res.ok) setSaved(false);
      } else {
        const res = await saveToCloset(variantId, "want");
        if (res.ok) {
          setSaved(true);
          track(EVENTS.itemSaved, { variant_id: variantId, status: "want" });
        }
      }
    });
  }

  function toggleWatch() {
    if (!signedIn) return;
    startTransition(async () => {
      const res = watching ? await removeFromWatchlist(variantId) : await addToWatchlist(variantId);
      if (res.ok) {
        if (!watching) track(EVENTS.itemSaved, { variant_id: variantId, kind: "watchlist" });
        setWatching(!watching);
      }
    });
  }

  const cellBase =
    "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2.5 text-xs transition-colors disabled:opacity-40";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:hidden">
      <div className="mx-auto flex w-full max-w-3xl items-stretch">
        {signedIn ? (
          <>
            <button
              type="button"
              onClick={toggleSave}
              disabled={pending}
              aria-pressed={saved}
              className={`${cellBase} ${saved ? "text-gold" : "text-muted hover:text-gold"}`}
            >
              <span aria-hidden className="text-base">{saved ? "♥" : "♡"}</span>
              Save
            </button>
            <button
              type="button"
              onClick={toggleWatch}
              disabled={pending}
              aria-pressed={watching}
              className={`${cellBase} ${watching ? "text-gold" : "text-muted hover:text-gold"}`}
            >
              <span aria-hidden className="text-base">{watching ? "★" : "☆"}</span>
              Watch
            </button>
          </>
        ) : (
          <Link href="/login" className={`${cellBase} text-muted hover:text-gold`}>
            <span aria-hidden className="text-base">♡</span>
            Save
          </Link>
        )}
        <button
          type="button"
          onClick={() => jumpTo("where-to-sell")}
          className={`${cellBase} text-muted hover:text-gold`}
        >
          <span aria-hidden className="text-base">↑</span>
          Sell
        </button>
        {/* Buy is the single distinct primary CTA. */}
        <button
          type="button"
          onClick={() => jumpTo("where-to-buy")}
          className="m-1.5 flex flex-1 items-center justify-center rounded-full bg-gold px-3 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Where to buy
        </button>
      </div>
    </div>
  );
}
