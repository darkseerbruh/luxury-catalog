"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerAuthInterest } from "@/lib/authentication-actions";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Reusable "Notify me when authentication launches" button — the coming-soon
 * fake door, usable anywhere (bag page, thrift-find, closet). Records demand for
 * everyone (analytics) and saves signed-in users to the notify list. `variantId`
 * is optional: omit it for a general "I'd use this" signal not tied to one bag.
 */
export default function AuthInterestButton({
  variantId = null,
  signedIn,
  source,
  label = "Notify me when it's live",
}: {
  variantId?: number | null;
  signedIn: boolean;
  source: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "registered" | "needsLogin">("idle");
  const [pending, startTransition] = useTransition();

  function notifyMe() {
    track(EVENTS.authenticationInterest, { variant_id: variantId, signed_in: signedIn, source });
    if (!signedIn) {
      setState("needsLogin");
      return;
    }
    startTransition(async () => {
      const res = await registerAuthInterest(variantId);
      if (res.ok) setState("registered");
    });
  }

  if (state === "registered") {
    return (
      <p className="text-sm text-foreground">
        ✓ You&rsquo;re on the list — we&rsquo;ll email you the moment it&rsquo;s live.
      </p>
    );
  }
  if (state === "needsLogin") {
    return (
      <p className="text-sm text-foreground">
        Noted — thanks!{" "}
        <Link href="/login" className="text-gold hover:underline">Log in</Link> so we can reach you.
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={notifyMe}
      disabled={pending}
      className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-40"
    >
      {pending ? "Adding you…" : label}
    </button>
  );
}
