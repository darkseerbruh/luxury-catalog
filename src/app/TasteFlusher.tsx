"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveQuizAnswers } from "@/lib/taste-actions";
import { PENDING_QUIZ_KEY } from "@/lib/taste-pending";
import { useAuthState } from "@/components/AuthProvider";

/**
 * Persists a logged-out visitor's quiz answers the moment they have an account.
 * The quiz shows results without sign-up and stashes the answers in localStorage;
 * this mounts app-wide, so wherever the new user lands after creating their
 * account, their taste profile is saved and the UI refreshed — closing the
 * "take the quiz -> sign up -> keep your results" loop. No-op when signed out or
 * when there's nothing pending.
 */
export default function TasteFlusher() {
  const { signedIn } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!signedIn) return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PENDING_QUIZ_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    let answers: Record<string, string>;
    try {
      answers = JSON.parse(raw);
    } catch {
      try {
        localStorage.removeItem(PENDING_QUIZ_KEY);
      } catch {}
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await saveQuizAnswers(answers);
      if (res.ok && !cancelled) {
        try {
          localStorage.removeItem(PENDING_QUIZ_KEY);
        } catch {}
        router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, router]);

  return null;
}
