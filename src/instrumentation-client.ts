/**
 * Next.js client instrumentation.
 *
 * This file runs after the HTML loads but before React hydration, which makes it
 * the ideal place to initialize analytics so early lifecycle events are captured.
 * See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
 * instrumentation-client.md.
 */
import { initAnalytics } from "@/lib/analytics/posthog";

try {
  initAnalytics();
} catch {
  // Never let instrumentation failures affect page load.
}
