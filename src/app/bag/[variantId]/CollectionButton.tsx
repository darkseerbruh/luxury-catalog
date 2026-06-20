"use client";

import { useState, useTransition } from "react";
import { setBagStatus, removeBag, setAvailabilityNotify } from "@/lib/actions";

type Status = "want" | "own" | "had" | null;

const OPTIONS: { value: Exclude<Status, null>; label: string }[] = [
  { value: "want", label: "Want it" },
  { value: "own", label: "I own it" },
  { value: "had", label: "Had it" },
];

export default function CollectionButton({
  variantId,
  signedIn,
  initialStatus,
  initialNotify,
}: {
  variantId: number;
  signedIn: boolean;
  initialStatus: Status;
  initialNotify: boolean;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [notify, setNotify] = useState(initialNotify);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: Exclude<Status, null>) {
    setError(null);
    const next = status === value ? null : value;
    startTransition(async () => {
      const res = next
        ? await setBagStatus({ variantId, status: next })
        : await removeBag({ variantId });
      if (res.ok) {
        setStatus(next);
        if (next !== "want") setNotify(false);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function toggleNotify() {
    setError(null);
    const next = !notify;
    startTransition(async () => {
      const res = await setAvailabilityNotify({ variantId, notify: next });
      if (res.ok) {
        setNotify(next);
        if (next) setStatus("want");
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">Track this bag</h2>

      <div className="flex flex-wrap gap-3">
        {OPTIONS.map((o) => {
          const active = status === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => choose(o.value)}
              disabled={pending}
              aria-pressed={active}
              className={`rounded-full border px-5 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted hover:border-gold hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Wishlist availability alert — only meaningful for a wanted bag. */}
      {status === "want" && (
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={notify}
            onChange={toggleNotify}
            disabled={pending}
            className="h-4 w-4 accent-gold"
          />
          Email me when this becomes available to buy
        </label>
      )}

      {status === "own" && (
        <p className="mt-4 text-sm text-muted">
          You own this — help others by leaving a review. Reviews open up with the
          UGC release.
        </p>
      )}

      {!signedIn && (
        <p className="mt-4 text-sm text-muted/70">
          Sign-in isn&rsquo;t live yet — this is where you&rsquo;ll save bags to
          your collection and wishlist.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-muted">{error}</p>}
    </section>
  );
}
