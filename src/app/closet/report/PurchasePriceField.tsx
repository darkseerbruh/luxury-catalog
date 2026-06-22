"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPurchasePrice } from "@/lib/collection-actions";

/** Inline "what you paid" editor for a row of the collection report. Saves on
 *  blur and refreshes so the server recomputes gain/loss. */
export default function PurchasePriceField({
  variantId,
  initial,
  currency,
}: {
  variantId: number;
  initial: number | null;
  currency: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial != null ? String(initial) : "");
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);

  function save() {
    const trimmed = value.trim();
    const num = trimmed === "" ? null : Number(trimmed);
    if (num != null && (!Number.isFinite(num) || num < 0)) {
      setErr(true);
      return;
    }
    if ((initial ?? null) === num) return; // unchanged
    setErr(false);
    start(async () => {
      const res = await setPurchasePrice(variantId, num, currency);
      if (res.ok) router.refresh();
      else setErr(true);
    });
  }

  return (
    <span className="inline-flex items-center justify-end gap-1">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        disabled={pending}
        placeholder="—"
        aria-label="What you paid"
        className={`w-24 rounded border bg-surface px-2 py-1 text-right text-sm text-foreground focus:outline-none ${
          err ? "border-red-400" : "border-border focus:border-gold"
        }`}
      />
    </span>
  );
}
