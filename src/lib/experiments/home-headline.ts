/**
 * Home headline A/B/C test.
 *
 * Single variable: the hero H1 copy (the subhead and the search box are
 * identical across all three arms, so a lift is cleanly attributable to the
 * headline — per the one-variable rule in docs/ux/homepage-experiments.md).
 *
 * Success metric: engagement with the hero search box (the `home_search_engaged`
 * event). PostHog reads the conversion as a funnel `experiment_exposed` →
 * `home_search_engaged`, broken down by the `variant` property.
 *
 * Assignment: uniform random three-way split, done server-side per homepage
 * impression. Cookieless (nothing written to the device, honoring the Tier-1
 * measurement model), so the unit of analysis is the impression, not the person.
 * When PostHog is unconfigured the events no-op and the default headline still
 * renders, so this is safe with or without analytics set up.
 */

export const HOME_HEADLINE_FLAG = "home_headline";

export type HomeHeadlineVariant = "utility" | "confidence" | "manifesto";

export const HOME_HEADLINE_VARIANTS: HomeHeadlineVariant[] = [
  "utility",
  "confidence",
  "manifesto",
];

/** The three headline arms. Subhead stays constant (single variable). */
export const HOME_HEADLINE_COPY: Record<HomeHeadlineVariant, string> = {
  // A — utility / GEO (the shipped default, and the control).
  utility: "Look up any designer bag: real prices, authentication, and history.",
  // B — decision-moment confidence.
  confidence: "Know any bag before you spend a dollar on it.",
  // C — manifesto echo.
  manifesto: "What’s real, what it’s worth, and where to buy it smart.",
};

/** Rendered when no assignment is made; also the control arm. */
export const HOME_HEADLINE_DEFAULT: HomeHeadlineVariant = "utility";

/**
 * Pick one of the three arms for this homepage impression. Uniform random split.
 * `HOME_HEADLINE_FORCE` (env) pins a single arm for QA / screenshots / a paused
 * test, e.g. HOME_HEADLINE_FORCE=manifesto.
 */
export function assignHomeHeadline(): HomeHeadlineVariant {
  const forced = process.env.HOME_HEADLINE_FORCE;
  if (forced && (HOME_HEADLINE_VARIANTS as string[]).includes(forced)) {
    return forced as HomeHeadlineVariant;
  }
  const i = Math.floor(Math.random() * HOME_HEADLINE_VARIANTS.length);
  return HOME_HEADLINE_VARIANTS[i] ?? HOME_HEADLINE_DEFAULT;
}
