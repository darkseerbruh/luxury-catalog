"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveToCloset, removeFromCloset } from "@/lib/collection-actions";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * The sitewide quick-save heart. Saves a variant to the `want` list from any bag
 * card, so saving is consistent everywhere (not just the bag detail page).
 * Optimistic; routes a signed-out user to /login on the auth error.
 */
export function QuickSaveHeart({
  variantId,
  initialSaved = false,
  source = "card",
  className = "",
}: {
  variantId: number;
  initialSaved?: boolean;
  source?: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle(e: React.MouseEvent) {
    // The heart usually sits inside a card-level link; don't navigate.
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    start(async () => {
      const res = next ? await saveToCloset(variantId, "want") : await removeFromCloset(variantId);
      if (!res.ok) {
        setSaved(!next);
        // Signed-out save = the moment to create an account (not log in). The
        // intended bag rides along so the save can finish after signup.
        if (/log in/i.test(res.error ?? "")) router.push(`/signup?next=/bag/${variantId}`);
      } else if (next) {
        track(EVENTS.itemSaved, { variant_id: variantId, status: "want", source });
        // First-ever save: nudge the price alert once (FirstAlertNudge gates on a
        // local flag, so this is a no-op after the first time).
        try {
          if (!localStorage.getItem("lc:first-alert-nudge")) {
            window.dispatchEvent(new CustomEvent("lc:first-save", { detail: { variantId } }));
          }
        } catch {
          /* localStorage blocked: skip the nudge */
        }
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Saved to your want list" : "Save to your want list"}
      aria-pressed={saved}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg/70 backdrop-blur transition-colors hover:border-gold ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M12 20s-7-4.35-9.5-8.5C.5 8 2 4.5 5.5 4.5c2 0 3.3 1.2 4.5 2.7 1.2-1.5 2.5-2.7 4.5-2.7 3.5 0 5 3.5 3 7C19 15.65 12 20 12 20z"
          fill={saved ? "var(--color-gold)" : "none"}
          stroke={saved ? "var(--color-gold)" : "var(--color-muted)"}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
