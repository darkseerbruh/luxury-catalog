"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewCorrection } from "@/lib/correction-actions";

export default function CorrectionActions({ correctionId }: { correctionId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "accepted" | "rejected") {
    setError(null);
    startTransition(async () => {
      const res = await reviewCorrection(correctionId, decision);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => decide("accepted")}
          disabled={pending}
          className="rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          disabled={pending}
          className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-red-400/50 hover:text-red-400 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
