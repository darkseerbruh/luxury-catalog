"use client";

import { useState } from "react";
import { BagFinder, type BagFinderSelection } from "@/components/BagFinder";
import { saveToCloset } from "@/lib/collection-actions";
import { submitReview } from "@/lib/review-actions";
import { castAxisVote } from "@/lib/vote-actions";
import { OCCASIONS } from "@/lib/occasions";
import { AXES, AXIS_META } from "@/lib/axes";

/**
 * Adding a bag to your closet IS reviewing it (docs/ux/unified-search-and-review-spec.md).
 * Find the bag → Want / Have / Had → and Have/Had opens the review inline in the
 * SAME sheet (Letterboxd's single Log sheet). Wired to the existing per-variant
 * `submitReview` + `saveToCloset` + `castAxisVote` server actions. All fields past
 * the star rating are optional, so the floor stays low for founding reviewers.
 */

type Step = "find" | "fork" | "done";
type Status = "want" | "have" | "had";

function AxisPips({
  value,
  onChange,
  meta,
}: {
  value: number;
  onChange: (n: number) => void;
  meta: { label: string; low: string; high: string };
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-sm text-foreground">{meta.label}</p>
        {value > 0 && (
          <button type="button" onClick={() => onChange(0)} className="text-xs text-muted hover:text-gold">
            clear
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-right text-[0.7rem] text-muted/70">{meta.low}</span>
        <div className="flex flex-1 justify-between" role="radiogroup" aria-label={meta.label}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${meta.label}: ${n} of 5`}
              onClick={() => onChange(n)}
              className={`h-6 w-6 rounded-full border transition-colors ${
                value === n ? "border-gold bg-gold" : "border-border bg-surface hover:border-gold"
              }`}
            />
          ))}
        </div>
        <span className="w-16 shrink-0 text-[0.7rem] text-muted/70">{meta.high}</span>
      </div>
    </div>
  );
}

function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm text-muted">{label}</p>
      <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            className={`text-2xl leading-none transition-colors ${n <= value ? "text-gold" : "text-muted/40 hover:text-muted"}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function ClosetAddFlow() {
  const [step, setStep] = useState<Step>("find");
  const [sel, setSel] = useState<BagFinderSelection | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [worthIt, setWorthIt] = useState<boolean | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [durability, setDurability] = useState(0);
  const [axisValues, setAxisValues] = useState<Record<string, number>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSel(null);
    setStatus(null);
    setRating(0);
    setTitle("");
    setBody("");
    setWorthIt(null);
    setOccasion(null);
    setDurability(0);
    setAxisValues({});
    setError(null);
    setStep("find");
  }

  async function pickWant() {
    if (!sel?.variantId) return;
    setSaving(true);
    setError(null);
    const res = await saveToCloset(sel.variantId, "want");
    setSaving(false);
    if (!res.ok) return setError(res.error ?? "Could not save.");
    setStatus("want");
    setStep("done");
  }

  async function saveReview() {
    if (!sel?.variantId || !status) return;
    if (rating < 1) return setError("Please choose a rating.");
    setSaving(true);
    setError(null);
    const saved = await saveToCloset(sel.variantId, status);
    if (!saved.ok) {
      setSaving(false);
      return setError(saved.error ?? "Could not save.");
    }
    const rev = await submitReview({
      variantId: sel.variantId,
      rating,
      title: title || undefined,
      body: body || undefined,
      worthIt,
      occasion: occasion ?? undefined,
      durabilityRating: durability > 0 ? durability : null,
    });
    // Opinion axes are optional and best-effort: a failed axis vote never blocks
    // the saved review. One upsert per axis the reviewer actually set.
    const variantId = sel.variantId;
    const setAxes = Object.entries(axisValues).filter(([, v]) => v > 0);
    if (setAxes.length > 0) {
      await Promise.all(setAxes.map(([axis, value]) => castAxisVote({ variantId, axis, value })));
    }
    setSaving(false);
    if (!rev.ok) return setError(rev.error ?? "Could not save your review.");
    setStep("done");
  }

  const card = "rounded-2xl border border-border bg-surface p-5";
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition-colors ${
      active ? "border-gold bg-gold/10 text-gold" : "border-border bg-surface text-muted hover:border-gold"
    }`;

  if (step === "find") {
    return (
      <div className={card}>
        <BagFinder mode="closet" autoFocus onSelect={(s) => { setSel(s); setStep("fork"); }} />
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className={`${card} text-center`}>
        <p className="font-serif text-xl text-foreground">Added to your closet</p>
        <p className="mt-1 text-sm text-muted">
          {status === "want"
            ? `${sel?.brand} ${sel?.styleName} is on your wishlist.`
            : `Your review of the ${sel?.brand} ${sel?.styleName} is live.`}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-full border border-gold px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
        >
          Add another bag
        </button>
      </div>
    );
  }

  const reviewing = status === "have" || status === "had";

  return (
    <div className={card}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <p className="font-serif text-lg text-foreground">{sel?.styleName}</p>
          <p className="text-sm text-muted">
            {sel?.brand}
            {sel?.colourName ? ` · ${sel.colourName}` : " · colour not set"}
          </p>
        </div>
        <button type="button" onClick={reset} className="text-xs text-muted transition-colors hover:text-gold">
          Change
        </button>
      </div>

      <p className="mt-3 text-sm text-muted">That&apos;s the {sel?.brand} {sel?.styleName}.</p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {(["want", "have", "had"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => (s === "want" ? pickWant() : setStatus(s))}
            className={`rounded-2xl border p-3 text-center transition-colors ${
              status === s ? "border-gold bg-gold/10" : "border-border bg-surface hover:border-gold"
            }`}
          >
            <span className="block text-sm font-medium capitalize text-foreground">{s}</span>
            <span className="block text-xs text-muted">
              {s === "want" ? "wishlist" : s === "have" ? "own it now" : "owned it"}
            </span>
          </button>
        ))}
      </div>

      {reviewing && (
        <div className="mt-5 flex flex-col gap-5">
          <Stars value={rating} onChange={setRating} label="Your rating" />

          <div>
            <p className="mb-1.5 text-sm text-muted">In your words <span className="text-muted/60">optional</span></p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A one-line take"
              className="mb-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="What you love, what you'd change, how it wears…"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm text-muted">Worth the price?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setWorthIt(worthIt === true ? null : true)} className={chip(worthIt === true)}>
                Worth it
              </button>
              <button type="button" onClick={() => setWorthIt(worthIt === false ? null : false)} className={chip(worthIt === false)}>
                Not for me
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm text-muted">When do you carry it? <span className="text-muted/60">optional</span></p>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOccasion(occasion === o.value ? null : o.value)}
                  className={chip(occasion === o.value)}
                >
                  {o.chip}
                </button>
              ))}
            </div>
          </div>

          <Stars value={durability} onChange={setDurability} label="How's it holding up? (optional)" />

          <div>
            <p className="mb-3 text-sm text-muted">How it wears <span className="text-muted/60">optional</span></p>
            <div className="flex flex-col gap-4">
              {AXES.map((axis) => (
                <AxisPips
                  key={axis}
                  meta={AXIS_META[axis]}
                  value={axisValues[axis] ?? 0}
                  onChange={(n) => setAxisValues((prev) => ({ ...prev, [axis]: n }))}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={saveReview}
            disabled={saving}
            className="rounded-full bg-gold px-4 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add to closet"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
