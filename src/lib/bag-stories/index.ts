import { BAG_STORIES } from "./data";
import type { BagStory } from "./types";

export type { BagStory, StoryTidbit, StoryPerson, StorySource, StoryVideo, TidbitKind } from "./types";

/** Case- and diacritic-insensitive brand comparison ("Hermès" == "hermes"). */
function sameBrand(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  return norm(a) === norm(b);
}

/**
 * Pure, synchronous match against the code-defined stories. This is the seed +
 * fallback source and the unit-tested matcher. Returns null when no hero story
 * is seeded for the style (so the module simply does not render).
 *
 * When `brandName` is provided, a story only matches inside its own house —
 * name fragments alone once let LV's "Daily Pouch" pick up Bottega's Pouch
 * story, which put another house's lore on the page (never-invent violation).
 */
export function matchBagStory(
  styleName: string | null | undefined,
  brandName?: string | null,
): BagStory | null {
  if (!styleName) return null;
  const name = styleName.toLowerCase();
  return (
    BAG_STORIES.find(
      (s) =>
        (!brandName || sameBrand(s.brand, brandName)) &&
        s.match.some((frag) => name.includes(frag)),
    ) ?? null
  );
}

/**
 * Resolves the story for a bag, DB-first with a code fallback (the editable
 * source once migration 0033 + seed-bag-stories have run; the code data until
 * then, and on any DB error). RESILIENT: any failure (missing table, no env,
 * query error) returns the code match, so the bag page never breaks.
 *
 * A DB row is trusted only if the code-side story for the same fragments
 * belongs to this brand (the style_story table has no brand column yet, so the
 * code data is the brand authority; unknown fragments are allowed through).
 *
 * The supabase client is imported dynamically so importing this module from a
 * non-request context (tests, scripts) never pulls in `next/headers`.
 */
export async function getBagStory(
  styleName: string | null | undefined,
  brandName?: string | null,
): Promise<BagStory | null> {
  if (!styleName) return null;
  const fallback = matchBagStory(styleName, brandName);
  const name = styleName.toLowerCase();

  try {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("style_story")
      .select("match, tagline, watch_query, tidbits, people, videos");
    if (error || !data) return fallback;

    const row = data.find((r) => {
      if (!Array.isArray(r.match) || !r.match.some((frag: string) => name.includes(frag))) {
        return false;
      }
      if (!brandName) return true;
      const codeTwin = BAG_STORIES.find((s) =>
        s.match.some((frag) => r.match.includes(frag)),
      );
      return !codeTwin || sameBrand(codeTwin.brand, brandName);
    });
    if (!row) return fallback;

    const videos = Array.isArray(row.videos) && row.videos.length > 0 ? row.videos : undefined;
    return {
      brand: fallback?.brand ?? brandName ?? "",
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
