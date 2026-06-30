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
  {
    match: ["chanel"],
    lead: "The couturière who freed women from corsets, then gave them a bag with a strap so their hands were free too.",
    beats: [
      {
        icon: "scissors",
        lead: "A couturière first.",
        body: "Gabrielle ‘Coco’ Chanel built the house on freeing women from corsets, long before the first bag.",
      },
      {
        icon: "clasp",
        lead: "February 1955.",
        body: "She named the quilted flap for its own birthday, the 2.55, and added a shoulder strap so women had their hands back.",
      },
      {
        icon: "stitch",
        lead: "The diamond quilt.",
        body: "The house signature, stitched on pebbled caviar or soft lambskin leather.",
      },
      {
        icon: "family",
        lead: "Named for a love.",
        body: "Karl Lagerfeld called Chanel’s edgiest bag the Boy, after Boy Capel, the great love of Coco’s life.",
      },
    ],
  },
  {
    match: ["louis vuitton", "vuitton"],
    lead: "A trunk maker whose canvas, drawn to defeat counterfeiters, became the most copied print in luxury.",
    beats: [
      {
        icon: "trunk",
        lead: "Paris, 1854.",
        body: "Louis Vuitton opened as a malletier, a maker of flat-topped trunks that stacked where domed ones could not.",
      },
      {
        icon: "loom",
        lead: "1896, against the fakes.",
        body: "Georges Vuitton drew the Monogram canvas to make the house impossible to copy.",
      },
      {
        icon: "tag",
        lead: "Named from the map of Paris.",
        body: "The Capucines for the street of the first store, the Alma for a bridge, the Petite Malle a trunk small enough to wear.",
      },
      {
        icon: "clasp",
        lead: "Travel, shrunk to the city.",
        body: "The Speedy was a 1930s travel bag made small; the Neverfull, a 2007 tote that turns fully inside out.",
      },
    ],
  },
];
