"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "@/lib/actions";

type Mode = "idle" | "reporting" | "done" | "error";

export default function FeedbackWidget({ variantId }: { variantId: number }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(feedbackType: "confirm accurate" | "inaccurate" | "missing information") {
    setError(null);
    startTransition(async () => {
      const res = await submitFeedback({ variantId, feedbackType, note });
      if (res.ok) {
        setMode("done");
      } else {
        setError(res.error ?? "Something went wrong.");
        setMode("error");
      }
    });
  }

  if (mode === "done") {
    return (
      <section className="border-t border-border pt-8">
        <div className="rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-foreground">
          Thank you — your feedback helps us prioritize what to research next.
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">Is this information accurate?</h2>

      {mode !== "reporting" ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => send("confirm accurate")}
            disabled={pending}
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Saving…" : "Yes, looks accurate"}
          </button>
          <button
            type="button"
            onClick={() => setMode("reporting")}
            disabled={pending}
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Something&rsquo;s wrong or missing
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's inaccurate or missing? (optional)"
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => send("inaccurate")}
              disabled={pending}
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Sending…" : "Report inaccuracy"}
            </button>
            <button
              type="button"
              onClick={() => send("missing information")}
              disabled={pending}
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Sending…" : "Report missing info"}
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

      {error && <p className="mt-3 text-sm text-muted">{error}</p>}
    </section>
  );
}
