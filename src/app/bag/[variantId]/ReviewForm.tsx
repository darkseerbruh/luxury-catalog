"use client";

import { useState, useTransition } from "react";
import { submitReview, deleteReview } from "@/lib/review-actions";
import { saveToCloset } from "@/lib/collection-actions";
import { track, EVENTS } from "@/lib/analytics/events";
import type { ReviewItem } from "@/lib/reviews";

const CLOSET_PROMPT_OPTIONS: { value: "want" | "have" | "had"; label: string }[] = [
  { value: "have", label: "Have it" },
  { value: "had", label: "Had it" },
  { value: "want", label: "Want it" },
];

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={`text-2xl leading-none transition-colors ${n <= value ? "text-gold" : "text-border hover:text-gold/50"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({
  variantId,
  signedIn,
  existing,
  inCloset,
}: {
  variantId: number;
  signedIn: boolean;
  existing: ReviewItem | null;
  /** Whether the bag is already in the user's closet — gates the post-review add prompt. */
  inCloset: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [closetPrompt, setClosetPrompt] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [worthIt, setWorthIt] = useState<boolean | null>(existing?.worthIt ?? null);
  const [occasion, setOccasion] = useState(existing?.occasion ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <a
        href="/login"
        className="inline-block rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
      >
        Log in to write a review
      </a>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          {existing ? "Edit your review" : "Write a review"}
        </button>
        {renderClosetPrompt()}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  function save() {
    setError(null);
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    startTransition(async () => {
      const res = await submitReview({
        variantId,
        rating,
        title,
        body,
        worthIt,
        occasion,
      });
      if (res.ok) {
        track(EVENTS.reviewSubmitted, { variant_id: variantId, rating });
        setOpen(false);
        // Reviewing a bag you don't track? Offer to add it to the closet.
        if (!inCloset) setClosetPrompt(true);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function addToCloset(status: "want" | "have" | "had") {
    setError(null);
    startTransition(async () => {
      const res = await saveToCloset(variantId, status);
      if (res.ok) {
        track(EVENTS.itemSaved, { variant_id: variantId, status });
        setClosetPrompt(false);
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  function renderClosetPrompt() {
    if (!closetPrompt) return null;
    return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
      <p className="text-sm text-foreground">
        Thanks for the review. It&rsquo;s not in your closet yet — want to add it?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CLOSET_PROMPT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => addToCloset(o.value)}
            disabled={pending}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setClosetPrompt(false)}
          className="rounded-full px-3 py-1.5 text-sm text-muted/70 transition-colors hover:text-foreground"
        >
          No thanks
        </button>
      </div>
    </div>
    );
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteReview(variantId);
      if (res.ok) {
        setRating(0);
        setTitle("");
        setBody("");
        setWorthIt(null);
        setOccasion("");
        setOpen(false);
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Your rating</span>
        <Stars value={rating} onChange={setRating} />
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Title (optional)"
        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="How does it actually wear? Durability, sizing, what fits…"
        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted">Worth it?</span>
          {([["Yes", true], ["No", false]] as const).map(([label, val]) => (
            <button
              key={label}
              type="button"
              onClick={() => setWorthIt(worthIt === val ? null : val)}
              className={`rounded-full border px-3 py-1 transition-colors ${
                worthIt === val ? "border-gold text-gold" : "border-border text-muted hover:border-gold/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          maxLength={80}
          placeholder="Occasion (everyday, evening…)"
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-40"
        >
          {pending ? "Saving…" : "Submit review"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2.5 text-sm text-muted/70 transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        {existing && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="ml-auto rounded-full px-4 py-2.5 text-sm text-muted/70 transition-colors hover:text-red-400 disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
