"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Fires auth_section_engaged when the visitor actually engages the bag page's
 * authentication content: once when the "How to authenticate" checklist scrolls
 * into view, and once when the "Serial & authentication tags" disclosure is
 * expanded. Tiny client island so the page stays a Server Component (matches the
 * TrackBagView idiom). Each signal fires at most once per page load, and carries
 * which section it was so we can tell reading from expanding.
 */
export default function AuthEngagementTracker({ variantId }: { variantId: number }) {
  useEffect(() => {
    const fired = new Set<string>();
    const fire = (section: string) => {
      if (fired.has(section)) return;
      fired.add(section);
      track(EVENTS.authSectionEngaged, { variant_id: variantId, section });
    };

    // 1) The "How to authenticate" checklist scrolled into view.
    const checklist = document.getElementById("authentication");
    let observer: IntersectionObserver | undefined;
    if (checklist && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            fire("how_to_authenticate");
            observer?.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      observer.observe(checklist);
    }

    // 2) The "Serial & authentication tags" disclosure expanded.
    const tags = document.getElementById("authentication-tags");
    const onToggle = () => {
      if ((tags as HTMLDetailsElement | null)?.open) fire("serial_tags");
    };
    tags?.addEventListener("toggle", onToggle);

    return () => {
      observer?.disconnect();
      tags?.removeEventListener("toggle", onToggle);
    };
  }, [variantId]);

  return null;
}
