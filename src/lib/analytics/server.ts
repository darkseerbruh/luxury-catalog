/**
 * Server-side PostHog capture, for emitting events from Route Handlers /
 * server code alongside the Supabase write (e.g. search_not_found,
 * feedback_submitted, inquiry_submitted).
 *
 * Server-only — never import this from a Client Component. Reads a server-only
 * project key so it works even before the public browser key is wired up.
 */
import { PostHog } from "posthog-node";

const POSTHOG_KEY =
  process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!POSTHOG_KEY) return null;
  if (!client) {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Flush quickly; serverless invocations are short-lived.
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export interface ServerEvent {
  /**
   * Stable id for the actor. Pass the same id the browser uses where possible
   * (e.g. a Supabase user id) so server and client events stitch together.
   * Falls back to an anonymous marker.
   */
  distinctId?: string;
  event: string;
  properties?: Record<string, unknown>;
}

/** Capture a server-side event. No-op (resolves) when analytics is unconfigured. */
export async function captureServer({
  distinctId,
  event,
  properties,
}: ServerEvent): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  ph.capture({
    distinctId: distinctId ?? "server-anonymous",
    event,
    properties: { ...properties, $process_person_profile: false },
  });
  // Ensure delivery before the serverless function returns.
  await ph.flush().catch(() => undefined);
}

/** Flush and close the client. Call at the end of long-running scripts. */
export async function shutdownServerAnalytics(): Promise<void> {
  if (client) {
    await client.shutdown().catch(() => undefined);
    client = null;
  }
}
