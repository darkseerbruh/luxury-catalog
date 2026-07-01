"use client";

import Link from "next/link";
import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";
import { QUIZ_HEADLINE_FLAG, type QuizHeadlineVariant } from "@/lib/experiments/quiz-headline";

/**
 * The logged-out style-read quiz callout, client-side so it runs the quiz_headline
 * A/B test: renders the server-assigned headline, fires the exposure event on mount,
 * and fires the success metric (quiz_started) when the visitor clicks Start. The
 * headline is the only varying element (single variable). All tracking no-ops when
 * analytics is unconfigured, so the callout renders and works regardless of setup.
 */
export function StyleReadCallout({
  variant,
  headline,
}: {
  variant: QuizHeadlineVariant;
  headline: string;
}) {
  useEffect(() => {
    track(EVENTS.experimentExposed, { flag: QUIZ_HEADLINE_FLAG, variant });
  }, [variant]);

  return (
    <section className="border-b border-border bg-gold/5 px-5 py-12 text-center">
      <p className="text-sm uppercase tracking-widest text-gold">Style read</p>
      <h2 className="mx-auto mt-2 max-w-xl font-serif text-2xl text-foreground sm:text-3xl">
        {headline}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        A two-minute style read. We hand you the words for your taste, then match you
        to bags. <span className="text-foreground">No account needed.</span>
      </p>
      <Link
        href="/quiz"
        onClick={() => track(EVENTS.quizStarted, { flag: QUIZ_HEADLINE_FLAG, variant })}
        className="mt-6 inline-block rounded-full bg-gold px-6 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
      >
        Start
      </Link>
    </section>
  );
}

export default StyleReadCallout;
