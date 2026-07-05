"use client";

import { useEffect } from "react";
import { track, type EventName, type CatalogEventProperties } from "@/lib/analytics/events";

/**
 * Generic mount-time view tracker for server-rendered surfaces (closet value,
 * collection report). Event names come from the EVENTS registry at the call
 * site; props ride along untouched.
 */
export default function TrackView({
  event,
  props = {},
}: {
  event: EventName;
  props?: CatalogEventProperties;
}) {
  useEffect(() => {
    track(event, props);
    // Mount-only by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
