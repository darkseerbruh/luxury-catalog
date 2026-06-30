import type { HeritageIconName } from "@/components/HeritageIcon";

/**
 * The structured "house story" — our honest, never-a-wall analog of a magazine
 * house profile. Authored per curated house so the narrative renders as short,
 * icon-led beats instead of a paragraph. Houses without an authored story fall
 * back to the brand's description, reflowed into short sentences (see index.ts).
 *
 * Every factual claim in a beat must trace to a real source; value/market claims
 * are framed as a tendency, never a verdict (see docs/voice-and-tone.md).
 */

/** One beat in the story: a heritage mark, a short bold lead, a sentence of body. */
export interface StoryBeat {
  icon: HeritageIconName;
  /** The short emphasized opener (a few words). */
  lead: string;
  /** One sentence of context. Kept short so no beat becomes a wall. */
  body: string;
}

export interface HouseStory {
  /** Lowercased brand-name fragments this story applies to. */
  match: string[];
  /** The serif lead line shown under the heading (one short sentence). */
  lead: string;
  beats: StoryBeat[];
}
