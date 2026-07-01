"use client";

/**
 * Client providers: captures pageviews on App Router navigation. The Router does
 * not auto-fire pageviews on client-side navigation, so we capture them manually.
 *
 * PostHog is loaded lazily (see lib/analytics/posthog.ts), so we do NOT wrap the
 * tree in <PostHogProvider> or import posthog-js/react here — that would pull the
 * SDK back into the initial bundle. Pageviews go through the buffered
 * `capturePageview`, which loads/queues as needed.
 */
import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

import { isAnalyticsEnabled } from "@/lib/analytics/config";
import { capturePageview } from "@/lib/analytics/posthog";
import { ConsentNotice } from "@/components/ConsentNotice";

function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isAnalyticsEnabled) return;
    // Read the full URL after navigation completes so query strings are correct.
    capturePageview(window.location.href);
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (!isAnalyticsEnabled) return <>{children}</>;

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
      <ConsentNotice />
    </>
  );
}
