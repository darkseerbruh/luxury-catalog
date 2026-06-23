/**
 * Canonical, closed set of review "occasions" — the structured replacement for
 * the old free-text `review.occasion` field (decision 2026-06-23,
 * docs/ux/review-data-leaderboards.md). One source of truth shared by the review
 * form (low-effort taps), the server-side write validation, the review display,
 * and the occasion leaderboards, so a value can only ever be one of these.
 *
 * The DB column stays `text`; migration 0028 backfills legacy free text into
 * these buckets and adds a CHECK constraint. The app enforces the set immediately
 * (the form only emits these, the action rejects anything else), so the feature
 * is correct even before the migration is applied — the migration just adds
 * DB-level enforcement and cleans up old rows.
 */

export const OCCASIONS = [
  { value: "everyday", chip: "Everyday", board: "Best for everyday" },
  { value: "work", chip: "Work", board: "Best for work" },
  { value: "evening", chip: "Evening", board: "Best for evening" },
  { value: "travel", chip: "Travel", board: "Best for travel" },
  { value: "special", chip: "Special occasion", board: "Best for special occasions" },
] as const;

export type Occasion = (typeof OCCASIONS)[number]["value"];

const VALUES = new Set<string>(OCCASIONS.map((o) => o.value));
const CHIPS = new Map<string, string>(OCCASIONS.map((o) => [o.value, o.chip]));

/** Type guard: is `x` one of the canonical occasions? */
export function isOccasion(x: unknown): x is Occasion {
  return typeof x === "string" && VALUES.has(x);
}

/**
 * Friendly label for displaying a stored occasion. Returns the chip label for a
 * known value; for a legacy free-text value (pre-migration rows that weren't
 * backfilled) it falls back to the raw string so nothing renders blank.
 */
export function occasionLabel(value: string | null): string | null {
  if (!value) return null;
  return CHIPS.get(value) ?? value;
}

/**
 * The occasion boards surfaced on the homepage. A subset of the full set: the
 * distinct "where did you carry it" use cases the leaderboards doc names
 * (evening / work / travel). everyday/special still feed recs + future boards.
 */
export const HOMEPAGE_OCCASION_BOARDS: Occasion[] = ["evening", "work", "travel"];
