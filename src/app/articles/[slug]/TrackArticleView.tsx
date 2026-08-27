"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";
import { hasFinishedReading, readState, recordArticleRead, writeState } from "@/lib/signup-prompt";

/**
 * Fires article_viewed on mount so editorial reads (a top entry channel) show up
 * in the journey funnels and connect to downstream bag views. Only mounted for
 * published posts, so author draft-previews don't inflate the metric.
 *
 * Also decides when the reader has actually FINISHED the guide, and ticks the
 * signup-prompt counter if so (added 2026-08-27). Article reads are the site's
 * biggest real channel and used to be invisible to that counter, which only
 * ever ticked on bag pages, so a guide reader could never be offered an
 * account. Qualification is deliberately strict (real dwell AND real depth,
 * thresholds in `@/lib/signup-prompt`) because mount alone counts bounces.
 */
export default function TrackArticleView({
  slug,
  postId,
  title,
  department = null,
}: {
  slug: string;
  postId: number;
  title: string;
  department?: string | null;
}) {
  useEffect(() => {
    track(EVENTS.articleViewed, { slug, post_id: postId, title });
    // The auth guides are where a reseller's marker-reading actually happens;
    // without this leg the flip funnel (auth_section_engaged ->
    // outbound_consign_clicked) could never fire on guide reads.
    if (department === "authentication") {
      track(EVENTS.authSectionEngaged, { section: "brand_guide", slug });
    }
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const openedAt = Date.now();
    let done = false;
    let queued = false;

    function depth(): number {
      const doc = document.documentElement;
      // A page shorter than the viewport has nothing to scroll, so the reader
      // can only ever be at the bottom of it. Treat that as full depth and let
      // the dwell gate do the deciding.
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return 1;
      return (window.scrollY || doc.scrollTop || 0) / scrollable;
    }

    function evaluate() {
      queued = false;
      if (done) return;
      if (!hasFinishedReading(depth(), Date.now() - openedAt)) return;
      done = true;
      const before = readState();
      const after = recordArticleRead(before, slug);
      // A re-read returns the same object. Nothing changed, so nothing to
      // announce: SignupPrompt would only re-evaluate an unmoved counter.
      if (after !== before) {
        writeState(after);
        window.dispatchEvent(new CustomEvent("lc:article-read"));
      }
    }

    function onScroll() {
      // Coalesce a scroll burst into one check per frame. rAF also parks the
      // work while the tab is hidden, which is correct here: a background tab
      // is not being read.
      if (queued || done) return;
      queued = true;
      window.requestAnimationFrame(evaluate);
    }

    // Depth can already be satisfied on arrival (short guide, tall window), so
    // the dwell gate needs a wake-up that no scroll will ever provide.
    const timer = window.setTimeout(evaluate, READ_CHECK_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
    // Slug-scoped: a client-side move to another guide restarts the clock.
  }, [slug]);

  return null;
}

/**
 * When to run the no-scroll check. Sits just past the dwell floor so a reader
 * who parks at the top of a short guide still qualifies without touching the
 * wheel, and a bot that left long ago is never around to be counted.
 */
const READ_CHECK_MS = 26_000;
