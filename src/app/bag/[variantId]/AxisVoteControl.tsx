"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { castAxisVote, clearAxisVote } from "@/lib/vote-actions";

/**
 * Signed-in 1..5 voting control for a single axis. Optimistic-ish: saves via the
 * server action then refreshes so the aggregate bar re-renders. Dependency-free.
 */
export default function AxisVoteControl({
  variantId,
  axis,
  low,
  high,
  initialValue,
}: {
  variantId: number;
  axis: string;
  low: string;
  high: string;
  initialValue: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState<number | null>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cast(next: number) {
    setError(null);
    // Tapping your current vote again clears it.
    const clearing = value === next;
    setValue(clearing ? null : next);
    startTransition(async () => {
      const res = clearing
        ? await clearAxisVote(variantId, axis)
        : await castAxisVote({ variantId, axis, value: next });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        setValue(initialValue);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.7rem] text-muted/70">{low}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={`Rate ${low} to ${high}`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} of 5`}
              disabled={pending}
              onClick={() => cast(n)}
              className={`h-6 w-6 rounded-full border text-xs transition-colors disabled:opacity-50 ${
                value != null && n <= value
                  ? "border-gold bg-gold/20 text-gold"
                  : "border-border text-muted hover:border-gold/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-[0.7rem] text-muted/70">{high}</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
