"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Bootstraps PostHog flag values from the server into the client SDK.
 * Prevents flicker by pre-loading the flag state before the first client-side
 * flag evaluation (especially important in cookieless mode where flags aren't
 * cached in localStorage between sessions — spec C18).
 *
 * Rendered server-side with the evaluated flag values as props so the data
 * is in the initial HTML with no extra round-trip.
 */
export function PostHogFlagBootstrap({
  flags,
}: {
  flags: Record<string, string | boolean>;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Override flag values in the running PostHog instance.
    // This keeps the client in sync with what the server rendered.
    posthog.featureFlags.override(flags);
  }, [flags]);

  return null;
}
