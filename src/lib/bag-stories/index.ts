import { BAG_STORIES } from "./data";
import type { BagStory } from "./types";

export type { BagStory, StoryTidbit, StoryPerson, StorySource, StoryVideo, TidbitKind } from "./types";

/**
 * Pure, synchronous match against the code-defined stories. This is the seed +
 * fallback source and the unit-tested matcher. Returns null when no hero story
 * is seeded for the style (so the module simply does not render).
 */
export function matchBagStory(styleName: string | null | undefined): BagStory | null {
  if (!styleName) return null;
  const name = styleName.toLowerCase();
  return BAG_STORIES.find((s) => s.match.some((frag) => name.includes(frag))) ?? null;
}

/**
 * Resolves the story for a bag, DB-first with a code fallback (the editable
 * source once migration 0033 + seed-bag-stories have run; the code data until
 * then, and on any DB error). RESILIENT: any failure (missing table, no env,
 * query error) returns the code match, so the bag page never breaks.
 *
 * The supabase client is imported dynamically so importing this module from a
 * non-request context (tests, scripts) never pulls in `next/headers`.
 */
export async function getBagStory(styleName: string | null | undefined): Promise<BagStory | null> {
  if (!styleName) return null;
  const fallback = matchBagStory(styleName);
  const name = styleName.toLowerCase();

  try {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("style_story")
      .select("match, tagline, watch_query, tidbits, people, videos");
    if (error || !data) return fallback;

    const row = data.find(
      (r) => Array.isArray(r.match) && r.match.some((frag: string) => name.includes(frag)),
    );
    if (!row) return fallback;

    const videos = Array.isArray(row.videos) && row.videos.length > 0 ? row.videos : undefined;
    return {
      match: row.match,
      tagline: row.tagline,
      watchQuery: row.watch_query ?? "",
      tidbits: row.tidbits ?? [],
      people: row.people ?? [],
      videos,
    } as BagStory;
  } catch {
    return fallback;
  }
}
