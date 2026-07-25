"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "@/components/AuthProvider";
import { track, EVENTS } from "@/lib/analytics/events";
import { getEffectiveConsent } from "@/lib/analytics/posthog";
import {
  markDismissed,
  markShown,
  readState,
  shouldPrompt,
  writeState,
} from "@/lib/signup-prompt";

/** Breathing room after the bag page settles, so the card never lands mid-read. */
const APPEAR_DELAY_MS = 2500;

/**
 * The signup moment for a signed-out visitor who has looked at enough bags to
 * be doing real research (threshold + cooldown logic lives in
 * `@/lib/signup-prompt`, unit-tested).
 *
 * What it is: a dismissible card at the bottom of the viewport.
 * What it is NOT: an interstitial, a paywall, or a content swap. The page under
 * it stays fully readable, which keeps our end of the "catalog stays free
 * forever" decision and keeps crawler output identical to what a human sees.
 *
 * The pitch is the reader's own value first (keep the bags you love, hear about
 * price drops, be findable by other collectors). The community give-back is one
 * line underneath, never the headline.
 */
export default function SignupPrompt() {
  const { signedIn, ready } = useAuthState();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState(0);
  const [bagViews, setBagViews] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(
    (reason: "dismissed" | "accepted") => {
      setOpen(false);
      if (reason === "dismissed") {
        writeState(markDismissed(readState()));
        track(EVENTS.signupPromptDismissed, { ask, bag_views: bagViews, trigger: "bag_views" });
      } else {
        track(EVENTS.signupPromptAccepted, { ask, bag_views: bagViews, trigger: "bag_views" });
      }
    },
    [ask, bagViews],
  );

  useEffect(() => {
    // Signed-in visitors never see it, and we wait for the session read so a
    // returning member doesn't get a flash of the ask.
    if (!ready || signedIn) return;

    function evaluate() {
      // Never stack two asks. While the analytics consent notice is still
      // undecided it owns the bottom of the screen, so we wait our turn and
      // re-evaluate on the next bag view. A GPC browser resolves to "denied"
      // without ever showing that notice, so those visitors aren't shut out.
      if (getEffectiveConsent() === null) return;

      const state = readState();
      if (!shouldPrompt(state, Date.now())) return;
      if (timer.current) return; // already queued
      timer.current = setTimeout(() => {
        timer.current = null;
        // Re-read at fire time: another tab may have shown or silenced it.
        const fresh = readState();
        if (!shouldPrompt(fresh, Date.now())) return;
        writeState(markShown(fresh, Date.now()));
        setAsk(fresh.shows + 1);
        setBagViews(fresh.seen.length);
        setOpen(true);
        track(EVENTS.signupPromptShown, {
          ask: fresh.shows + 1,
          bag_views: fresh.seen.length,
          trigger: "bag_views",
        });
      }, APPEAR_DELAY_MS);
    }

    evaluate();
    window.addEventListener("lc:bag-viewed", evaluate);
    return () => {
      window.removeEventListener("lc:bag-viewed", evaluate);
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [ready, signedIn]);

  // Escape closes it, same as the dismiss button.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close("dismissed");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const next = pathname && pathname.startsWith("/") ? pathname : "/";

  return (
    // Bottom-RIGHT on desktop, not centered: the middle of a bag page is the
    // variant selector, and an ask should never sit on top of the thing they
    // came to use. Full width on mobile, where there is no side to tuck into.
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:left-auto sm:right-6 sm:justify-end print:hidden">
      <div
        ref={cardRef}
        role="region"
        aria-label="Create a free account"
        className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-serif text-lg leading-snug text-foreground">
            Keep the ones you love
          </p>
          <button
            type="button"
            onClick={() => close("dismissed")}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-muted/80 transition-colors hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
          <li className="flex items-start gap-2.5">
            <Bullet />
            <span>Save any bag to your closet, so your shortlist is in one place.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Bullet />
            <span>Hear about it when one turns up below the typical resale price.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Bullet />
            <span>Build a closet other collectors can find you by.</span>
          </li>
        </ul>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            onClick={() => close("accepted")}
            className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Create a free account
          </Link>
          <button
            type="button"
            onClick={() => close("dismissed")}
            className="text-sm text-muted/80 transition-colors hover:text-foreground"
          >
            Not now
          </button>
        </div>

        <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted/80">
          The catalog stays free either way. Saves and reviews from people like you
          are how we know which bags to keep refreshed first.
        </p>
      </div>
    </div>
  );
}

/** Small non-logo mark so the benefit list reads as a list, not a paragraph. */
function Bullet() {
  return (
    <svg viewBox="0 0 12 12" className="mt-1.5 h-2 w-2 shrink-0" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="none" stroke="var(--color-gold)" strokeWidth="2" />
    </svg>
  );
}
