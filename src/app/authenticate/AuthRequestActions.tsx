"use client";

import { useTransition, useState } from "react";
import { claimAuthRequest, closeAuthRequest } from "@/lib/authentication-actions";

export function ClaimButton({ requestId }: { requestId: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await claimAuthRequest(requestId);
            if (!res.ok) setError(res.error ?? "Something went wrong.");
          });
        }}
        className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-40"
      >
        Claim
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function CloseButton({ requestId }: { requestId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await closeAuthRequest(requestId); })}
      className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
    >
      Mark closed
    </button>
  );
}
