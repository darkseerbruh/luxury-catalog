import { BAG_STORIES } from "./data";
import type { BagStory } from "./types";

export type { BagStory, StoryTidbit, StoryPerson, StorySource, TidbitKind } from "./types";

/**
 * Looks up the editorial story for a bag by its style name. Returns null when
 * we have not researched/seeded a story yet, so the module simply does not
 * render (graceful, never a fabricated placeholder).
 */
export function getBagStory(styleName: string | null | undefined): BagStory | null {
  if (!styleName) return null;
  const name = styleName.toLowerCase();
  return BAG_STORIES.find((s) => s.match.some((frag) => name.includes(frag))) ?? null;
}
