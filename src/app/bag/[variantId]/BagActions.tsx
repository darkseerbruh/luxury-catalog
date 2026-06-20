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

const STATUS_LABELS: { value: "researching" | "wishlist" | "owned"; label: string }[] = [
  { value: "researching", label: "Researching" },
  { value: "wishlist", label: "Wishlist" },
  { value: "owned", label: "I own this" },
];

export default function BagActions({
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
  const [closetStatus, setClosetStatus] = useState<string | null>(initialClosetStatus);
  const [watching, setWatching] = useState(initialWatching);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <section className="border-t border-border pt-8">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Save this bag to your closet or track its price.
          </p>
          <Link
            href="/login"
            className="shrink-0 rounded-full bg-gold px-5 py-2.5 text-center text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Log in to save
          </Link>
        </div>
      </section>
    );
  }

  function toggleCloset(status: "researching" | "wishlist" | "owned") {
    setError(null);
    startTransition(async () => {
      // Clicking the active status removes it from the closet.
      if (closetStatus === status) {
        const res = await removeFromCloset(variantId);
        if (res.ok) setClosetStatus(null);
        else setError(res.error ?? "Something went wrong.");
        return;
      }
      const res = await saveToCloset(variantId, status);
      if (res.ok) {
        setClosetStatus(status);
        track(EVENTS.itemSaved, { variant_id: variantId, status });
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  function toggleWatch() {
    setError(null);
    startTransition(async () => {
      const res = watching ? await removeFromWatchlist(variantId) : await addToWatchlist(variantId);
      if (res.ok) {
        if (!watching) track(EVENTS.itemSaved, { variant_id: variantId, kind: "watchlist" });
        setWatching(!watching);
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">Save this bag</h2>
      <div className="flex flex-wrap gap-2">
        {STATUS_LABELS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => toggleCloset(s.value)}
            disabled={pending}
            className={`rounded-full border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              closetStatus === s.value
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted hover:border-gold hover:text-gold"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleWatch}
          disabled={pending}
          className={`rounded-full border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            watching
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-muted hover:border-gold hover:text-gold"
          }`}
        >
          {watching ? "★ Watching price" : "☆ Watch price"}
        </button>
      </div>
      {watching && (
        <p className="mt-3 text-sm text-muted">
          Set a target price on your{" "}
          <Link href="/watchlist" className="text-gold hover:underline">
            watchlist
          </Link>
          .
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  );
}
