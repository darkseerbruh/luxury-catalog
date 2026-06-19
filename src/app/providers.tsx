"use client";

/**
 * Client providers: wires the (already-initialized) PostHog instance into React
 * so components can use `usePostHog()`, and captures pageviews on App Router
 * navigation. The Router does not auto-fire pageviews on client-side
 * navigation, so we capture them manually here.
 */
import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PostHogProvider } from "posthog-js/react";

import { isAnalyticsEnabled } from "@/lib/analytics/config";
import { posthog } from "@/lib/analytics/posthog";
import { ConsentNotice } from "@/components/ConsentNotice";

function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isAnalyticsEnabled) return;
    // Read the full URL after navigation completes so query strings are correct.
    posthog.capture("$pageview", {
      $current_url: window.location.href,
    });
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (!isAnalyticsEnabled) return <>{children}</>;

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
      <ConsentNotice />
    </PostHogProvider>
  );
}
