"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setWear } from "@/lib/wear-actions";
import {
  CARRY_OPTIONS,
  WEIGHT_OPTIONS,
  FITS_NOTE_MAX,
  type Carry,
  type WeightFeel,
} from "@/lib/wear-options";

/**
 * Signed-in carry + weight-feel taps for a bag, plus a short "what fit inside"
 * note. Each chip row is single-select; tapping your current pick again clears
 * it. Saves via setWear (one field at a time, server-merged) then refreshes so
 * the aggregate re-renders. Mirrors AxisVoteControl. Dependency-free.
 */
export default function WearTaps({
  variantId,
  initialCarry,
  initialWeight,
  initialFitsNote,
}: {
  variantId: number;
  initialCarry: Carry | null;
  initialWeight: WeightFeel | null;
  initialFitsNote: string | null;
}) {
  const router = useRouter();
  const [carry, setCarry] = useState<Carry | null>(initialCarry);
  const [weight, setWeight] = useState<WeightFeel | null>(initialWeight);
  const [fitsNote, setFitsNote] = useState<string>(initialFitsNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fitsDirty = fitsNote.trim() !== (initialFitsNote ?? "").trim();

  function saveFits() {
    if (!fitsDirty) return;
    setError(null);
    startTransition(async () => {
      const res = await setWear({ variantId, fitsNote });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        setFitsNote(initialFitsNote ?? "");
        return;
      }
      router.refresh();
    });
  }

  function pickCarry(next: Carry) {
    setError(null);
    const clearing = carry === next;
    const value = clearing ? null : next;
    setCarry(value);
    startTransition(async () => {
      const res = await setWear({ variantId, carry: value });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        setCarry(initialCarry);
        return;
      }
      router.refresh();
    });
  }

  function pickWeight(next: WeightFeel) {
    setError(null);
    const clearing = weight === next;
    const value = clearing ? null : next;
    setWeight(value);
    startTransition(async () => {
      const res = await setWear({ variantId, weightFeel: value });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        setWeight(initialWeight);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <ChipRow
        legend="How do you carry it?"
        options={CARRY_OPTIONS}
        selected={carry}
        disabled={pending}
        onPick={(v) => pickCarry(v as Carry)}
      />
      <ChipRow
        legend="How heavy does it feel?"
        options={WEIGHT_OPTIONS}
        selected={weight}
        disabled={pending}
        onPick={(v) => pickWeight(v as WeightFeel)}
      />

      <div>
        <label htmlFor="fits-note" className="mb-2 block text-sm font-medium text-foreground">
          What fits inside?
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="fits-note"
            type="text"
            value={fitsNote}
            maxLength={FITS_NOTE_MAX}
            disabled={pending}
            placeholder="Phone, wallet, sunglasses..."
            onChange={(e) => setFitsNote(e.target.value)}
            onBlur={saveFits}
            className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={saveFits}
            disabled={pending || !fitsDirty}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function ChipRow({
  legend,
  options,
  selected,
  disabled,
  onPick,
}: {
  legend: string;
  options: readonly { value: string; label: string }[];
  selected: string | null;
  disabled: boolean;
  onPick: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((o) => {
          const active = selected === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onPick(o.value)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                active
                  ? "border-gold bg-gold/20 text-gold"
                  : "border-border text-muted hover:border-gold/50"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
