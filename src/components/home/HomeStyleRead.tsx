"use client";

import Link from "next/link";
import { useAuthState } from "@/components/AuthProvider";
import { useHomeMe } from "@/lib/use-home-me";
import StyleReadCallout from "@/components/StyleReadCallout";
import { QUIZ_HEADLINE_DEFAULT, QUIZ_HEADLINE_COPY } from "@/lib/experiments/quiz-headline";

/**
 * Style-read slot. Signed-out (and until auth resolves): the quiz callout, part
 * of the static shell. Signed-in: their saved style read (or a prompt to take
 * it), streamed in after the personalization fetch.
 */
export default function HomeStyleRead() {
  const { signedIn, ready } = useAuthState();
  const { data } = useHomeMe(signedIn);

  if (!ready || !signedIn) {
    return (
      <StyleReadCallout
        variant={QUIZ_HEADLINE_DEFAULT}
        headline={QUIZ_HEADLINE_COPY[QUIZ_HEADLINE_DEFAULT]}
      />
    );
  }

  const taste = data?.taste ?? null;

  return (
    <section className="border-b border-border px-5 py-8">
      {taste ? (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Your style read</p>
            <p className="mt-1 font-serif text-xl text-foreground">{taste.headline}</p>
            {taste.tags.length > 0 && (
              <p className="mt-1 text-sm text-muted">{taste.tags.join(" · ")}</p>
            )}
          </div>
          <Link
            href="/quiz"
            className="shrink-0 rounded-full border border-border px-5 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
          >
            Retake
          </Link>
        </div>
      ) : (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Style read</p>
            <p className="mt-1 font-serif text-xl text-foreground">See what your style says</p>
            <p className="mt-1 text-sm text-muted">Two minutes, and we tune the catalog to you.</p>
          </div>
          <Link
            href="/quiz"
            className="shrink-0 rounded-full bg-gold px-5 py-2 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Start
          </Link>
        </div>
      )}
    </section>
  );
}
