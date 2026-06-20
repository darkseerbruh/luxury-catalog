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
}: {
  query: string;
  resultCount: number;
}) {
  useEffect(() => {
    if (!query) return;
    track(EVENTS.searchPerformed, { query, result_count: resultCount });
    if (resultCount === 0) {
      track(EVENTS.searchNotFound, { query });
    }
    // Re-fire when the query or result count changes.
  }, [query, resultCount]);

  return null;
}
