"use client";
import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

export function ExperimentExposure({ flag, variant }: { flag: string; variant: string }) {
  useEffect(() => {
    track(EVENTS.experimentExposed, { flag, variant });
  }, [flag, variant]);
  return null;
}
