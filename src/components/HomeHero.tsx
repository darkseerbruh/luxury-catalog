"use client";

import { useEffect, useRef } from "react";
import { track, EVENTS } from "@/lib/analytics/events";
import { HOME_HEADLINE_FLAG, type HomeHeadlineVariant } from "@/lib/experiments/home-headline";

/**
 * The homepage hero, client-side so it can run the home_headline copy test:
 * renders the server-assigned headline, fires the exposure event on mount, and
 * fires the success metric (home_search_engaged) when the visitor engages the
 * hero search box. The headline is the ONLY thing that varies across arms; the
 * subhead and the search box are identical (single variable).
 *
 * All tracking no-ops when analytics is unconfigured, so the hero renders and
 * works regardless of PostHog setup.
 */
export function HomeHero({
  variant,
  headline,
}: {
  variant: HomeHeadlineVariant;
  headline: string;
}) {
  const engaged = useRef(false);

  useEffect(() => {
    track(EVENTS.experimentExposed, { flag: HOME_HEADLINE_FLAG, variant });
  }, [variant]);

  // Success metric: did the visitor engage the hero search box? Focus is the
  // primary signal (counted once per impression); submit is the deeper signal.
  function engage(kind: "focus" | "submit") {
    if (kind === "focus") {
      if (engaged.current) return;
      engaged.current = true;
    }
    track(EVENTS.homeSearchEngaged, { flag: HOME_HEADLINE_FLAG, variant, kind });
  }

  return (
    <section className="border-b border-border px-5 py-10 text-center">
      <h1 className="mx-auto max-w-2xl font-serif text-3xl leading-tight text-foreground sm:text-4xl">
        {headline}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        Production history, authentication markers, and real resale prices, all
        in one place.
      </p>
      <form
        action="/search"
        method="GET"
        onSubmit={() => engage("submit")}
        className="mx-auto mt-6 flex max-w-md items-center gap-2"
      >
        <input
          name="q"
          type="search"
          onFocus={() => engage("focus")}
          placeholder="Look up any bag: prices, authentication, history"
          className="min-w-0 flex-1 truncate rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Search
        </button>
      </form>
    </section>
  );
}

export default HomeHero;
