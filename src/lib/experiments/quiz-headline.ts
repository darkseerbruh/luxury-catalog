/**
 * Style-read quiz headline A/B test (the logged-out homepage callout).
 *
 * Single variable: the callout H2 copy. The subhead, the "Start" button, and the
 * layout are identical across both arms, so a lift is cleanly attributable to the
 * headline (the one-variable rule in docs/ux/homepage-experiments.md). The old
 * "Find out what your bags say about you" control was cut (it assumes ownership the
 * aspiring majority doesn't have); V3 (result-tease) was cut too.
 *
 * Success metric: quiz starts (the `quiz_started` event). PostHog reads the funnel
 * `experiment_exposed` → `quiz_started` broken down by the `variant` property.
 *
 * Assignment: uniform random two-way split, server-side per impression, cookieless
 * (unit of analysis = the impression). No-ops cleanly when analytics is unconfigured.
 */

export const QUIZ_HEADLINE_FLAG = "quiz_headline";

export type QuizHeadlineVariant = "style" | "time";

export const QUIZ_HEADLINE_VARIANTS: QuizHeadlineVariant[] = ["style", "time"];

/** The two arms. Headline is the only varying element (single variable). */
export const QUIZ_HEADLINE_COPY: Record<QuizHeadlineVariant, string> = {
  // V1 — taste frame.
  style: "What’s your handbag style, really?",
  // V2 — time + payoff.
  time: "Two minutes to your bag style",
};

export const QUIZ_HEADLINE_DEFAULT: QuizHeadlineVariant = "style";

/**
 * Pick an arm for this impression. `QUIZ_HEADLINE_FORCE` (env) pins one for QA /
 * screenshots / a paused test, e.g. QUIZ_HEADLINE_FORCE=time.
 */
export function assignQuizHeadline(): QuizHeadlineVariant {
  const forced = process.env.QUIZ_HEADLINE_FORCE;
  if (forced && (QUIZ_HEADLINE_VARIANTS as string[]).includes(forced)) {
    return forced as QuizHeadlineVariant;
  }
  const i = Math.floor(Math.random() * QUIZ_HEADLINE_VARIANTS.length);
  return QUIZ_HEADLINE_VARIANTS[i] ?? QUIZ_HEADLINE_DEFAULT;
}
