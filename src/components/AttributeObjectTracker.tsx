"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Fires attribute_object_viewed on mount for the object-oriented UX pages
 * (leather/silhouette/hardware/era/color). One island for all five, so the bet
 * on these pages becomes measurable. Server page stays a Server Component.
 */
export default function AttributeObjectTracker({
  kind,
  name,
}: {
  kind: string;
  name: string;
}) {
  useEffect(() => {
    track(EVENTS.attributeObjectViewed, { attribute_kind: kind, attribute_name: name });
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
