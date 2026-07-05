"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveToCloset } from "@/lib/collection-actions";
import { track, EVENTS } from "@/lib/analytics/events";
import { useAuthState } from "@/components/AuthProvider";

const KEY = "lc_pending_save";

/**
 * Completes a save that a signed-out visitor started. QuickSaveHeart stashes
 * the intent before routing to /signup; this mounts app-wide (like
 * TasteFlusher) and finishes the save the moment an account exists, so
 * "tap heart, sign up" actually ends with the bag on the want list.
 */
export default function PendingSaveFlusher() {
  const { signedIn } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!signedIn) return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      return;
    }
    if (!raw) return;

    let intent: { variantId?: number; source?: string };
    try {
      intent = JSON.parse(raw);
    } catch {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      return;
    }
    if (typeof intent.variantId !== "number") {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await saveToCloset(intent.variantId!, "want");
      if (!cancelled) {
        try {
          localStorage.removeItem(KEY);
        } catch {}
        if (res.ok) {
          track(EVENTS.itemSaved, {
            variant_id: intent.variantId,
            status: "want",
            source: intent.source ?? "pending-signup",
          });
          router.refresh();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, router]);

  return null;
}
