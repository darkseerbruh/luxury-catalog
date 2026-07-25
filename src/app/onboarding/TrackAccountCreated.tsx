"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";
import { markSilenced, readState, writeState } from "@/lib/signup-prompt";

const FIRED_PREFIX = "lc:account-created:";

/**
 * How fresh the auth account must be for this landing to count as the signup
 * itself. Generous enough to survive a slow email-confirmation round-trip,
 * tight enough that a returning OAuth user passing back through onboarding is
 * never miscounted as a new account.
 */
const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;

/**
 * Fires `account_created` exactly once per account.
 *
 * Why here: both signup paths (email/password and Google OAuth) land on
 * /onboarding, and `track()` is client-only. The server decides `isNew` from
 * the auth account's age, so a returning OAuth user passing back through
 * onboarding doesn't get counted as a new account. The localStorage guard is
 * belt-and-braces for a refresh on this page.
 *
 * Before this existed there was no signup event at all, so account creation was
 * invisible and every capture experiment was unscoreable in both directions.
 */
export default function TrackAccountCreated({
  userId,
  createdAt,
  method,
}: {
  userId: string;
  createdAt: string | null;
  method: string | null;
}) {
  useEffect(() => {
    // They have an account now, so the signed-out ask has nothing left to do.
    writeState(markSilenced(readState()));

    const createdMs = createdAt ? Date.parse(createdAt) : Number.NaN;
    const isNew =
      Number.isFinite(createdMs) && Date.now() - createdMs < NEW_ACCOUNT_WINDOW_MS;
    if (!isNew) return;
    const key = `${FIRED_PREFIX}${userId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      // Storage blocked: fire anyway. A rare duplicate beats a missing
      // conversion on the one event the whole funnel is measured from.
    }
    track(EVENTS.accountCreated, { method: method ?? "unknown" });
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
