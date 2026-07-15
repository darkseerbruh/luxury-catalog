"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  // Post-save reclassify prompt (owner 2026-07-14, option B): after a wishlist
  // save, offer to move the bag to what they actually own. Reclassify → have/had
  // is the bridge into the owner review flow + the consignor referral.
  const [prompt, setPrompt] = useState<null | "open" | "have" | "had">(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  function openPrompt() {
    setPrompt("open");
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setPrompt(null), 7000);
  }

  function moveTo(status: "have" | "had", e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    start(async () => {
      const res = await saveToCloset(variantId, status);
      if (res.ok) {
        track(EVENTS.itemSaved, { variant_id: variantId, status, source: `${source}:reclassify` });
        setPrompt(status);
        dismissTimer.current = setTimeout(() => setPrompt(null), 2500);
      }
    });
  }

  function toggle(e: React.MouseEvent) {
    // The heart usually sits inside a card-level link; don't navigate.
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    if (!next) setPrompt(null); // un-hearting closes the prompt
    start(async () => {
      const res = next ? await saveToCloset(variantId, "want") : await removeFromCloset(variantId);
      if (!res.ok) {
        setSaved(!next);
        // Signed-out save = the moment to create an account (not log in). The
        // intended bag rides along AND the save intent is stashed, so
        // PendingSaveFlusher completes it the moment the account exists
        // (before this, the heart flashed, bounced to signup, and the save
        // was silently lost).
        if (/log in/i.test(res.error ?? "")) {
          try {
            localStorage.setItem(
              "lc_pending_save",
              JSON.stringify({ variantId, source }),
            );
          } catch {
            /* private mode: the redirect still carries the bag */
          }
          router.push(`/signup?next=/bag/${variantId}`);
        }
      } else if (next) {
        track(EVENTS.itemSaved, { variant_id: variantId, status: "want", source });
        openPrompt();
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
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={saved ? "Saved to your want list" : "Save to your want list"}
        aria-pressed={saved}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg/70 backdrop-blur transition-colors hover:border-gold"
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

      {prompt && (
        <span
          role="dialog"
          aria-label="Move to your closet"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-border bg-surface p-3 text-left shadow-lg"
        >
          {prompt === "open" ? (
            <>
              <p className="text-xs leading-snug text-foreground">
                Saved to your wishlist. Already carry it?
              </p>
              <span className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => moveTo("have", e)}
                  disabled={pending}
                  className="flex-1 rounded-full border border-gold/60 px-2 py-1 text-xs text-gold transition-colors hover:bg-gold/10 disabled:opacity-40"
                >
                  Have it
                </button>
                <button
                  type="button"
                  onClick={(e) => moveTo("had", e)}
                  disabled={pending}
                  className="flex-1 rounded-full border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                >
                  Had it
                </button>
              </span>
            </>
          ) : (
            <p className="text-xs leading-snug text-foreground">
              {prompt === "have"
                ? "Moved to your closet. Tell us how it wears when you get a sec."
                : "Moved to Had it. See where to sell it whenever you're ready."}
            </p>
          )}
        </span>
      )}
    </span>
  );
}
