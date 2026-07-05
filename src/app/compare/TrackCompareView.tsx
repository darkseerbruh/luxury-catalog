"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Fires bags_compared when a compare table actually renders (source: "view").
 * The tray link fires on click (source: "tray"); without this, shared or
 * bookmarked ?ids= URLs, reloads, and back-navigation were invisible.
 */
export default function TrackCompareView({ count, ids }: { count: number; ids: string }) {
  useEffect(() => {
    track(EVENTS.bagsCompared, { count, variant_ids: ids, source: "view" });
  }, [count, ids]);
  return null;
}
