"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitCorrection } from "@/lib/correction-actions";
import { track, EVENTS } from "@/lib/analytics/events";

export interface CorrectableField {
  /** Stable field_path stored on the correction row (e.g. "exterior_colorway"). */
  path: string;
  /** Human label shown in the picker. */
  label: string;
  /** The current catalogued value, if any. */
  current: string | null;
}

type Mode = "idle" | "open" | "done";

export default function SuggestEdit({
  variantId,
  signedIn,
  fields,
}: {
  variantId: number;
  signedIn: boolean;
  fields: CorrectableField[];
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [fieldPath, setFieldPath] = useState(fields[0]?.path ?? "");
  const [suggested, setSuggested] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = fields.find((f) => f.path === fieldPath) ?? null;

  function send() {
    setError(null);
    if (!suggested.trim()) {
      setError("Enter your suggested value.");
      return;
    }
    startTransition(async () => {
      const res = await submitCorrection({
        variantId,
        fieldPath: selected?.label ? `${fieldPath} (${selected.label})` : fieldPath,
        currentValue: selected?.current ?? null,
        suggestedValue: suggested,
        note,
      });
      if (res.ok) {
        track(EVENTS.correctionSubmitted, { variant_id: variantId, field_path: fieldPath });
        setMode("done");
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  if (mode === "done") {
    return (
      <section className="border-t border-border pt-8">
        <div className="rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-foreground">
          Thank you — your suggestion was submitted for review. Accepted edits are applied
          by our team after verification.
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">Suggest an edit</h2>

      {mode === "idle" ? (
        <button
          type="button"
          onClick={() => setMode("open")}
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Spotted something to fix? Suggest an edit
        </button>
      ) : !signedIn ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted">
          Please{" "}
          <Link href="/login" className="text-gold hover:underline">
            log in
          </Link>{" "}
          to suggest an edit. Suggestions are reviewed before any change is applied.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Field</span>
            <select
              value={fieldPath}
              onChange={(e) => setFieldPath(e.target.value)}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground focus:border-gold focus:outline-none"
            >
              {fields.map((f) => (
                <option key={f.path} value={f.path}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <p className="text-xs text-muted/70">
              Current value: {selected.current ? <span className="text-muted">{selected.current}</span> : <em>not set</em>}
            </p>
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Suggested value</span>
            <input
              type="text"
              value={suggested}
              onChange={(e) => setSuggested(e.target.value)}
              maxLength={2000}
              placeholder="What it should say"
              className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Note / source (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Why, or a link to a source. Never invent authentication facts."
              className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={send}
              disabled={pending}
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
            >
              {pending ? "Submitting…" : "Submit suggestion"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("idle");
                setError(null);
              }}
              disabled={pending}
              className="rounded-full px-3 py-2.5 text-sm text-muted/70 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
