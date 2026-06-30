import { HOUSE_STORIES } from "./data";
import type { HouseStory } from "./types";

export type { HouseStory, StoryBeat } from "./types";

/**
 * The authored story for a house, matched on a name fragment. Null when none is
 * authored yet (the brand page then falls back to the reflowed description).
 */
export function matchHouseStory(brandName: string | null | undefined): HouseStory | null {
  if (!brandName) return null;
  const n = brandName.toLowerCase();
  return HOUSE_STORIES.find((s) => s.match.some((f) => n.includes(f))) ?? null;
}

/**
 * Split a description blob into sentences so it can be rendered as short beats
 * rather than a wall of text. Splits on sentence-ending punctuation followed by
 * a capital or opening quote; trims and drops empties. Good enough for the short,
 * curated brand descriptions we store (no attempt at perfect abbreviation
 * handling — the worst case is a slightly short fragment, never a wall).
 */
export function intoSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+(?=[“"A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}
