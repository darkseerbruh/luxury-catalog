"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Emits search_performed (and search_not_found when empty) for each executed
 * query. Client island so the search page stays a Server Component.
 */
export default function SearchTracker({
  query,
  resultCount,
  socialKey,
}: {
  query: string;
  resultCount: number;
  /** Set when the query exactly matched a video CTA key (social-search-keys). */
  socialKey?: string;
}) {
  useEffect(() => {
    if (!query) return;
    track(EVENTS.searchPerformed, {
      query,
      result_count: resultCount,
      ...(socialKey ? { social_key: socialKey } : {}),
    });
    if (resultCount === 0 && !socialKey) {
      track(EVENTS.searchNotFound, { query });
    }
    // Re-fire when the query or result count changes.
  }, [query, resultCount, socialKey]);

  return null;
}
