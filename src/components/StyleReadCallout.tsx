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
 *
 * The example deck (owner decision 2026-07-05): the module sells the payoff by
 * showing real reads, visibly ONE OF MANY (a fanned stack, three rotating cards,
 * "yours is built from your answers"). Every read below is a verbatim output of
 * tasteIdentity() run on a plausible answer set (never invented); regenerate via
 * the snippet in docs/ux/home-use-case-value-props.md if the vocabulary changes.
 */
const EXAMPLE_READS = [
  {
    headline: "You don't need it to shout.",
    read: "You feel composed, in control, warm and self-assured. The room feels that you have it handled.",
    tags: "Structured · No logos · Gold",
  },
  {
    headline: "You're happy to be appreciated.",
    read: "You feel alive, magnetic, warm and happy to be looked at. The room feels drawn in.",
    tags: "Glam · Logo-forward · Gold",
  },
  {
    headline: "You like a little armor.",
    read: "You feel sharp, a little untouchable, with an edge and in on it. The room feels it before you speak.",
    tags: "Edgy · Recognizable · Gunmetal",
  },
];

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
    <section className="border-b border-border bg-gold/5 px-5 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 sm:flex-row sm:gap-12">
        <div className="max-w-md text-center sm:flex-1 sm:text-left">
          <p className="text-sm uppercase tracking-widest text-gold">Style quiz</p>
          <h2 className="mt-2 font-serif text-2xl text-foreground sm:text-3xl">{headline}</h2>
          <p className="mt-3 text-muted">
            A two-minute style quiz. We hand you the words for your taste, then match
            you to bags. <span className="text-foreground">No account needed.</span>
          </p>
          <Link
            href="/quiz"
            onClick={() => track(EVENTS.quizStarted, { flag: QUIZ_HEADLINE_FLAG, variant })}
            className="mt-6 inline-block rounded-full bg-gold px-6 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Start
          </Link>
        </div>

        {/* The example deck: a fanned stack with three real reads crossfading.
            aria-hidden — it's illustrative; the copy on the left carries the
            meaning for screen readers. */}
        <div aria-hidden className="w-full max-w-sm sm:flex-1">
          <p className="mb-2 text-center text-[11px] uppercase tracking-[0.18em] text-muted sm:text-left">
            A few of the reads we hand out
          </p>
          <div className="relative">
            {/* Fanned edges behind the front card: multiplicity at a glance. */}
            <div className="absolute inset-0 -rotate-2 rounded-2xl border border-border bg-surface/60" />
            <div className="absolute inset-0 rotate-1 rounded-2xl border border-border bg-surface/80" />
            {/* Rotating front cards. min-h fits the longest read at 320px wide. */}
            <div className="relative min-h-[190px] sm:min-h-[180px]">
              {EXAMPLE_READS.map((r, i) => (
                <div
                  key={r.headline}
                  style={{ animationDelay: `${i * 4}s` }}
                  className={`read-cycle-card absolute inset-0 flex flex-col justify-center rounded-2xl border border-gold/30 bg-surface p-6 ${i === 0 ? "" : "opacity-0"}`}
                >
                  <p className="font-serif text-lg text-foreground">{r.headline}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{r.read}</p>
                  <p className="mt-3 text-xs text-gold-soft">{r.tags}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted sm:text-left">
            Yours is built from your answers, in your words.
          </p>
        </div>
      </div>
    </section>
  );
}

export default StyleReadCallout;
