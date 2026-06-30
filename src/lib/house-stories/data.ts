import type { HouseStory } from "./types";

/**
 * Authored house stories. Sourced narrative recut into short, icon-led beats.
 * Add a house here to upgrade it from the reflowed-description fallback to the
 * rich beats layout. Hermès is the first; sourcing lives in
 * docs/research-drafts/hermes-house-story.md.
 */
export const HOUSE_STORIES: HouseStory[] = [
  {
    match: ["hermès", "hermes"],
    lead: "The rare house where the world’s most wanted handbag began as a tool for a horse.",
    beats: [
      {
        icon: "saddlery",
        lead: "A Paris saddlery, 1837.",
        body: "Thierry Hermès made riding gear for European nobility.",
      },
      {
        icon: "stitch",
        lead: "The saddle-stitch stayed.",
        body: "Each Birkin and Kelly is cut, stitched and signed by a single artisan, start to finish.",
      },
      {
        icon: "clasp",
        lead: "1923, a first.",
        body: "The Bolide put the first zipper ever on a handbag.",
      },
      {
        icon: "tag",
        lead: "Named with stable logic.",
        body: "The Kelly for the princess, the Birkin for the actress, the Evelyne and Picotin straight from the stable.",
      },
      {
        icon: "family",
        lead: "Still in the family.",
        body: "Six generations on, the founding family still controls the house, a large part of why the waitlists and resale premiums run the way they do.",
      },
    ],
  },
];
