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

    // 1) The "How to authenticate" checklist scrolled into view. Fire as soon as
    // the section ENTERS the viewport (threshold 0), not at 30% coverage: this
    // section is tall (≈1.2k px settled, and briefly ≈5k px while images load),
    // so a 0.3 threshold needs ~1.5k px visible at once — unreachable on a normal
    // screen during the load window, which silently dropped the signal.
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
        { threshold: 0 },
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
