"use client";

import { useState, useTransition } from "react";
import { requestBag } from "@/lib/actions";
import { track, EVENTS } from "@/lib/analytics/events";

export default function RequestBagForm({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold">
        Got it — your request is in. The most-requested bags get researched
        first, so you just moved this one up.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
      >
        Ask us to add this bag
      </button>
    );
  }

  function action(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await requestBag(formData);
      if (res.ok) {
        track(EVENTS.bagRequested, { query });
        setDone(true);
      } else setError(res.error ?? "Something went sideways — try again.");
    });
  }

  return (
    <form action={action} className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 text-left">
      <input type="hidden" name="search_query" value={query} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="brand"
          placeholder="Brand (e.g. Gucci)"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <input
          name="style"
          placeholder="Style (e.g. Jackie 1961)"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>
      <textarea
        name="details"
        rows={2}
        maxLength={1000}
        placeholder="Anything else? Size, year, the exact color you're after"
        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-40"
        >
          {pending ? "Sending…" : "Submit request"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2.5 text-sm text-muted/70 transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
