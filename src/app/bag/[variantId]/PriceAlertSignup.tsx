"use client";

import { useState, useTransition } from "react";
import { subscribeToBagAlert } from "@/lib/actions";

/**
 * No-auth email capture for price-drop / availability alerts — the marketing
 * plan's Tier-2 "owned audience you don't rent" play. A genuine reason to give
 * an email (watch this bag) rather than a newsletter nobody wants.
 */
export default function PriceAlertSignup({ variantId }: { variantId: number }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await subscribeToBagAlert({ variantId, email });
      if (res.ok) setDone(true);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  if (done) {
    return (
      <section className="border-t border-border pt-8">
        <div className="rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-foreground">
          You&rsquo;re on the list — we&rsquo;ll email you when this bag&rsquo;s
          price drops or it becomes available.
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-2 font-serif text-xl text-foreground">Watch this bag</h2>
      <p className="mb-4 text-sm text-muted">
        Get one email when the price drops or a listing appears. No newsletter, no
        spam.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Saving…" : "Notify me"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-muted">{error}</p>}
    </section>
  );
}
