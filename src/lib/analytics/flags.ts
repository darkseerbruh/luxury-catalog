/**
 * Server-side PostHog feature flag evaluation and user identification
 * for the Phase-2 personalization layer. Server-only — never import from
 * a Client Component.
 *
 * Key decisions (from spec C16–C21):
 *   - Evaluate flags server-side with posthog-node (flushAt:1, await shutdown).
 *   - Pass personProperties explicitly — server SDK is stateless and silently
 *     skips conditions for properties you don't supply.
 *   - Write persona as a PostHog PERSON PROPERTY; target the flag on that —
 *     never on a behavioral cohort (those are disallowed as flag targets).
 *   - Bootstrap evaluated values to the client to kill hydration flicker.
 *   - Call identifyUserToPostHog at login to stitch anonymous → identified.
 */

import { PostHog } from "posthog-node";

const POSTHOG_KEY =
  process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

/** The name of the Phase-2 personalization experiment flag in PostHog. */
export const PERSONALIZED_HOME_FLAG = "personalized_home";

/** Properties we write as PostHog person properties (these ARE the targeting surface). */
export interface PersonPostHogProps {
  persona?: string | null;
  budget_band?: string | null;
  intent?: string | null;
}

function makeClient(): PostHog | null {
  if (!POSTHOG_KEY) return null;
  return new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

/**
 * Write user properties to PostHog (server-side identify).
 * Called at login/signup to stitch the anonymous session into the identified
 * user and to set the persona as a person property so flag targeting works.
 *
 * No-ops when PostHog is unconfigured.
 */
export async function identifyUserToPostHog(
  userId: string,
  props: PersonPostHogProps
): Promise<void> {
  const ph = makeClient();
  if (!ph) return;
  // Filter out null/undefined so we don't overwrite real values with nulls.
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v != null) clean[k] = v;
  }
  ph.identify({ distinctId: userId, properties: clean });
  await ph.shutdown().catch(() => undefined);
}

/**
 * Evaluate the personalized_home flag for a user server-side.
 *
 * Returns:
 *   - The flag value (string | boolean) from PostHog, or
 *   - false when PostHog is unconfigured or the flag evaluates to false/null.
 *
 * personProperties must include the targeting props (persona etc.) because
 * the server SDK is stateless — it doesn't look up the person profile on its own.
 */
export async function evaluatePersonalizationFlag(
  userId: string,
  personProperties: PersonPostHogProps
): Promise<string | boolean> {
  const ph = makeClient();
  if (!ph) return false;
  try {
    const value = await ph.getFeatureFlag(
      PERSONALIZED_HOME_FLAG,
      userId,
      { personProperties: personProperties as Record<string, string> }
    );
    return value ?? false;
  } catch {
    return false;
  } finally {
    await ph.shutdown().catch(() => undefined);
  }
}

/**
 * Evaluate ALL flags for a user and return bootstrap data for the client.
 *
 * The client PostHog SDK reads this data on init to avoid a round-trip flag
 * fetch (which would cause a layout shift / flicker in cookieless mode where
 * values aren't cached in localStorage).
 *
 * Returns null when PostHog is unconfigured.
 */
export async function getBootstrapFlags(
  userId: string,
  personProperties: PersonPostHogProps
): Promise<{ distinctId: string; flags: Record<string, string | boolean> } | null> {
  const ph = makeClient();
  if (!ph) return null;
  try {
    const result = await ph.getAllFlagsAndPayloads(userId, {
      personProperties: personProperties as Record<string, string>,
    });
    return {
      distinctId: userId,
      flags: (result.featureFlags ?? {}) as Record<string, string | boolean>,
    };
  } catch {
    return null;
  } finally {
    await ph.shutdown().catch(() => undefined);
  }
}
