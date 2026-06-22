"use client";

import { useTransition } from "react";
import { resetTasteAction } from "./actions";

export function ResetTasteButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("This clears your taste profile and recommendations. Start fresh?")) return;
        startTransition(() => resetTasteAction());
      }}
      disabled={pending}
      className="shrink-0 rounded-full border border-border px-4 py-2 text-xs text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
    >
      {pending ? "Resetting…" : "Reset taste"}
    </button>
  );
}
