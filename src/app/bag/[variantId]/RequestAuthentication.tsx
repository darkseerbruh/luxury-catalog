"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { submitAuthRequest } from "@/lib/authentication-actions";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * "Get it authenticated by a pro" on-ramp on the bag page — the lead-capture
 * entry to the authentication marketplace. No payment here: a verified
 * Authenticator claims the request and arranges the service off-platform.
 */
export default function RequestAuthentication({
  variantId,
  signedIn,
}: {
  variantId: number;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function action(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await submitAuthRequest(formData);
      if (res.ok) {
        track(EVENTS.authenticationRequested, { variant_id: variantId });
        setDone(true);
        setOpen(false);
        formRef.current?.reset();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <section id="get-authenticated" className="mt-4 rounded-2xl border border-gold/30 bg-gold/5 p-5">
      <p className="font-serif text-lg text-foreground">Want a pro to check it?</p>
      <p className="mt-1 text-sm text-muted">
        Request a hands-on review from one of our verified authenticators. We&rsquo;ll match
        you and they&rsquo;ll take it from there — pricing and the actual service are arranged
        directly with the authenticator.
      </p>

      {done ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-surface px-4 py-3 text-sm text-foreground">
          Request sent. You can track it on your{" "}
          <Link href="/authenticate" className="text-gold hover:underline">authentication requests</Link>{" "}
          page; an authenticator will reach out.
        </p>
      ) : signedIn ? (
        <>
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
            >
              Request authentication
            </button>
          )}
          {open && (
            <form ref={formRef} action={action} className="mt-4 flex flex-col gap-3">
              <input type="hidden" name="variantId" value={variantId} />
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted">What would you like checked? (optional)</span>
                <textarea
                  name="details"
                  rows={3}
                  maxLength={2000}
                  placeholder="Where you got it, what you're unsure about, date code / stamp details…"
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted">Contact email (optional — defaults to your account email)</span>
                <input
                  name="contactEmail"
                  type="email"
                  maxLength={200}
                  placeholder="you@example.com"
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                />
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-40"
                >
                  {pending ? "Sending…" : "Send request"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-gold">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <Link
          href="/login"
          className="mt-4 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Log in to request authentication
        </Link>
      )}
    </section>
  );
}
