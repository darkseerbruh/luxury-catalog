/**
 * Opinion-axis vocabulary + display copy (0012 `bag_axis`). Kept in its OWN
 * server-free module so client components (the closet-add review sheet, the
 * bag-page vote control) can import the axes without pulling votes.ts, which
 * imports server-only Supabase. votes.ts re-exports these for existing callers.
 *
 * The votable set is a SUBSET of the DB enum: `holds_value` (a market fact from
 * price_history, not an opinion) and `worth_the_price` (duplicates the review
 * `worth_it` boolean) are deliberately excluded. See docs/ux/review-data-leaderboards.md.
 */
export const AXES = [
  "build_quality",
  "everyday_wearability",
  "roomy_vs_compact",
  "comfort",
  "versatility",
] as const;

export type Axis = (typeof AXES)[number];

export function isAxis(value: string): value is Axis {
  return (AXES as readonly string[]).includes(value);
}

/** Display copy per axis. For roomy_vs_compact the scale is bipolar (low→high). */
export const AXIS_META: Record<Axis, { label: string; low: string; high: string }> = {
  build_quality: { label: "Build quality", low: "Flimsy", high: "Tank-like" },
  everyday_wearability: { label: "Everyday wearability", low: "Occasion-only", high: "Daily driver" },
  roomy_vs_compact: { label: "Roomy vs compact", low: "Compact", high: "Roomy" },
  comfort: { label: "Comfort to carry", low: "Awkward", high: "Effortless" },
  versatility: { label: "Versatility", low: "One-note", high: "Goes with anything" },
};
