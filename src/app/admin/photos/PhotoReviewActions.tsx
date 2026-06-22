"use client";

import { useTransition, useState } from "react";
import { reviewPhoto } from "@/lib/photo-actions";

export default function PhotoReviewActions({ photoId }: { photoId: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "approved" | "featured" | "rejected") {
    setError(null);
    startTransition(async () => {
      const res = await reviewPhoto(photoId, decision);
      if (!res.ok) setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={() => decide("approved")}
        disabled={pending}
        className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-40"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => decide("featured")}
        disabled={pending}
        className="rounded-full border border-gold/60 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10 disabled:opacity-40"
      >
        ★ Feature
      </button>
      <button
        type="button"
        onClick={() => decide("rejected")}
        disabled={pending}
        className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-40"
      >
        Reject
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
