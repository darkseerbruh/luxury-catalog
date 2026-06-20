"use client";

import { useState, useTransition } from "react";
import { removeBag, setAvailabilityNotify } from "@/lib/actions";

export default function BagItemActions({
  variantId,
  variant,
  initialNotify,
}: {
  variantId: number;
  variant: "collection" | "wishlist";
  initialNotify: boolean;
}) {
  const [removed, setRemoved] = useState(false);
  const [notify, setNotify] = useState(initialNotify);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await removeBag({ variantId });
      if (res.ok) setRemoved(true);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  function toggleNotify() {
    setError(null);
    const next = !notify;
    startTransition(async () => {
      const res = await setAvailabilityNotify({ variantId, notify: next });
      if (res.ok) setNotify(next);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  if (removed) {
    return <span className="text-xs text-muted/60">Removed</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {variant === "wishlist" && (
        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={notify}
            onChange={toggleNotify}
            disabled={pending}
            className="h-3.5 w-3.5 accent-gold"
          />
          Notify when available
        </label>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="text-muted/70 transition-colors hover:text-foreground disabled:opacity-40"
      >
        Remove
      </button>
      {error && <span className="text-muted">{error}</span>}
    </div>
  );
}
