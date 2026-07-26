"use client";

import { track, EVENTS } from "@/lib/analytics/events";

import { useState, useTransition } from "react";
import { updateWatch, removeFromWatchlist } from "@/lib/collection-actions";

type AlertMode = "absolute" | "pct_below_median";

const PCT_CHOICES = [5, 10, 15, 20, 25];

export default function WatchControls({
  variantId,
  initialTarget,
  initialAlert,
  initialMode = "pct_below_median",
  initialPct = 10,
  initialNotifyOnListing = true,
}: {
  variantId: number;
  initialTarget: number | null;
  initialAlert: boolean;
  initialMode?: AlertMode;
  initialPct?: number | null;
  initialNotifyOnListing?: boolean;
}) {
  const [mode, setMode] = useState<AlertMode>(initialMode);
  const [pct, setPct] = useState<number>(initialPct ?? 10);
  const [target, setTarget] = useState(initialTarget != null ? String(initialTarget) : "");
  const [alert, setAlert] = useState(initialAlert);
  const [onListing, setOnListing] = useState(initialNotifyOnListing);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [pending, startRemove] = useTransition();

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function savePct(next: number) {
    setPct(next);
    setMode("pct_below_median");
    setError(null);
    startTransition(async () => {
      const res = await updateWatch({ variantId, alertMode: "pct_below_median", alertPct: next });
      if (res.ok) track(EVENTS.alertUpdated, { variant_id: variantId, mode: "pct_below_median", pct: next });
      if (res.ok) flash();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  function saveTarget() {
    setError(null);
    const parsed = target.trim() === "" ? null : Number(target);
    startTransition(async () => {
      const res = await updateWatch({ variantId, alertMode: "absolute", targetPrice: parsed });
      if (res.ok) track(EVENTS.alertUpdated, { variant_id: variantId, mode: "absolute", target: parsed });
      if (res.ok) flash();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  /**
   * The availability floor. It sits UNDER the price rule rather than replacing
   * it: someone hunting a discontinued colourway wants to know one surfaced
   * even when they also set a target price.
   */
  function toggleOnListing() {
    setError(null);
    const next = !onListing;
    setOnListing(next);
    startTransition(async () => {
      const res = await updateWatch({ variantId, notifyOnListing: next });
      if (res.ok) {
        track(EVENTS.alertUpdated, { variant_id: variantId, notify_on_listing: next });
        flash();
      } else {
        setOnListing(!next);
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function toggleAlert() {
    setError(null);
    const next = !alert;
    setAlert(next);
    startTransition(async () => {
      const res = await updateWatch({ variantId, alertEnabled: next });
      if (res.ok) track(EVENTS.alertUpdated, { variant_id: variantId, enabled: next });
      if (!res.ok) {
        setAlert(!next);
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function remove() {
    startRemove(async () => {
      await removeFromWatchlist(variantId);
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {mode === "pct_below_median" ? (
          <>
            <span className="text-muted">Alert me at</span>
            <select
              value={pct}
              onChange={(e) => savePct(Number(e.target.value))}
              className="rounded-lg border border-border bg-bg px-2 py-1.5 text-foreground focus:border-gold focus:outline-none"
              aria-label="Percent below the typical resale price"
            >
              {PCT_CHOICES.map((p) => (
                <option key={p} value={p}>
                  {p}%
                </option>
              ))}
            </select>
            <span className="text-muted">below the typical resale price</span>
            <button
              type="button"
              onClick={() => setMode("absolute")}
              className="text-muted/80 underline-offset-2 transition-colors hover:text-gold hover:underline"
            >
              Use a specific price
            </button>
          </>
        ) : (
          <>
            <span className="text-muted">Alert under</span>
            <input
              type="number"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onBlur={saveTarget}
              placeholder="$"
              className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
            />
            <button
              type="button"
              onClick={() => savePct(pct)}
              className="text-muted/80 underline-offset-2 transition-colors hover:text-gold hover:underline"
            >
              Hunt a deal instead
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input type="checkbox" checked={alert} onChange={toggleAlert} className="accent-gold" />
          Alerts on
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={onListing}
            onChange={toggleOnListing}
            disabled={!alert}
            className="accent-gold disabled:opacity-40"
          />
          Tell me when one comes up, at any price
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
    </div>
  );
}
