"use client";

import { useState, useTransition } from "react";
import { updateWatch, removeFromWatchlist } from "@/lib/collection-actions";

export default function WatchControls({
  variantId,
  initialTarget,
  initialAlert,
}: {
  variantId: number;
  initialTarget: number | null;
  initialAlert: boolean;
}) {
  const [target, setTarget] = useState(initialTarget != null ? String(initialTarget) : "");
  const [alert, setAlert] = useState(initialAlert);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveTarget() {
    setError(null);
    setSaved(false);
    const parsed = target.trim() === "" ? null : Number(target);
    startTransition(async () => {
      const res = await updateWatch({ variantId, targetPrice: parsed });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  function toggleAlert() {
    setError(null);
    const next = !alert;
    setAlert(next);
    startTransition(async () => {
      const res = await updateWatch({ variantId, alertEnabled: next });
      if (!res.ok) {
        setAlert(!next);
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      await removeFromWatchlist(variantId);
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted">Alert under</span>
        <input
          type="number"
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onBlur={saveTarget}
          placeholder="—"
          className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-muted">
        <input type="checkbox" checked={alert} onChange={toggleAlert} className="accent-gold" />
        Alerts on
      </label>

      {saved && <span className="text-gold">Saved</span>}
      {error && <span className="text-red-400">{error}</span>}

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="ml-auto text-muted/70 transition-colors hover:text-red-400 disabled:opacity-40"
      >
        Remove
      </button>
    </div>
  );
}
