"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFourGrails } from "@/lib/grails-actions";

// Inlined (not imported from grails.ts, which pulls in server-only Supabase).
const MAX_GRAILS = 4;

export interface GrailCandidate {
  variantId: number;
  brandName: string;
  styleName: string;
  label: string;
}

/**
 * Picker for "My Four Grails": choose up to four bags from your closet, in rank
 * order. Selection order = slot 1..4. Mirrors SocialProfileForm's
 * useTransition + router.refresh save idiom.
 */
export default function GrailPicker({
  candidates,
  initial,
}: {
  candidates: GrailCandidate[];
  /** Current grail variant ids, in slot order. */
  initial: number[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>(initial.slice(0, MAX_GRAILS));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const byId = new Map(candidates.map((c) => [c.variantId, c]));

  function toggle(variantId: number) {
    setSaved(false);
    setError(null);
    setSelected((cur) => {
      if (cur.includes(variantId)) return cur.filter((id) => id !== variantId);
      if (cur.length >= MAX_GRAILS) {
        setError(`Only ${MAX_GRAILS} grails — remove one first.`);
        return cur;
      }
      return [...cur, variantId];
    });
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await setFourGrails(selected);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  if (candidates.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-6 text-sm text-muted">
        Add some bags to your closet first, then pin your four grails here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Chosen, in rank order */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-widest text-muted">
          Your four ({selected.length}/{MAX_GRAILS})
        </p>
        {selected.length === 0 ? (
          <p className="text-sm text-muted/70">None chosen yet — tap bags below.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {selected.map((id, i) => {
              const c = byId.get(id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-gold/30 bg-surface px-3 py-2 text-sm"
                >
                  <span className="font-serif text-lg text-gold">{i + 1}</span>
                  <span className="flex-1 text-foreground">
                    {c ? (
                      <>
                        <span className="text-muted">{c.brandName}</span> {c.styleName}
                        <span className="text-muted/70"> · {c.label}</span>
                      </>
                    ) : (
                      `Bag #${id}`
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="text-muted/70 transition-colors hover:text-red-400"
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Candidate grid from closet */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {candidates.map((c) => {
          const idx = selected.indexOf(c.variantId);
          const chosen = idx >= 0;
          return (
            <button
              key={c.variantId}
              type="button"
              onClick={() => toggle(c.variantId)}
              aria-pressed={chosen}
              className={`relative rounded-2xl border p-3 text-left transition-colors ${
                chosen ? "border-gold bg-gold/5" : "border-border bg-surface hover:border-gold/50"
              }`}
            >
              {chosen && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs font-medium text-bg">
                  {idx + 1}
                </span>
              )}
              <p className="text-[0.65rem] uppercase tracking-wide text-muted">{c.brandName}</p>
              <p className="mt-1 font-serif text-sm leading-tight text-foreground">{c.styleName}</p>
              <p className="mt-1 text-xs text-muted/70">{c.label}</p>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-gold">Saved.</p>}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="self-start rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save my four grails"}
      </button>
    </div>
  );
}
