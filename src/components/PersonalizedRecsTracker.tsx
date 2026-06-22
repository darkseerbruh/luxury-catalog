"use client";
import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

export function PersonalizedRecsTracker({ count }: { count: number }) {
  useEffect(() => {
    track(EVENTS.personalizedRecsViewed, { count });
  }, [count]);
  return null;
}
