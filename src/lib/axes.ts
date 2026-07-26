/**
 * Opinion-axis vocabulary + display copy (0059 `bag_axis`). Kept in its OWN
 * server-free module so client components (the closet-add review sheet, the
 * bag-page vote control) can import the axes without pulling votes.ts, which
 * imports server-only Supabase. votes.ts re-exports these for existing callers.
 *
 * The vocabulary is EVIDENCE-DERIVED, not assumed. A 2026-07-25 pass across six
 * bags spanning tiers (~100 owner-voice sources) established which dimensions
 * people actually compare bags on. Working: docs/research-drafts/axis-evidence-2026-07.md.
 *
 * THE RATE / DESCRIBE SPLIT — the load-bearing idea here:
 *
 *   "rate"     unipolar. One end is better. A judgement, higher effort, and
 *              prone to ceiling effects (everyone scores a Birkin 5 on build
 *              quality, so it carries little signal at the top tier).
 *
 *   "describe" polar. NEITHER end is better. Low effort, no wrong answer, so it
 *              has a much lower posting floor (the Letterboxd principle: no
 *              downvotes, no minimum). These also travel across tiers where the
 *              unipolar ones ceiling out.
 *
 * Why the split matters beyond UI: the polar axes are the ones a synthesized
 * web-consensus read can honestly populate. "The consensus reads this as dressy"
 * fairly summarizes what people wrote; "the web scores build quality 4/5" would
 * be an invention. So `describe` axes are the shared scale between scraped
 * reputation and first-party votes, and `rate` axes stay owner-only.
 *
 * DELIBERATELY NOT AXES:
 *   - Weight, dimensions, strap drop, pocket count, carry modes → MEASURABLE.
 *     Catalog data, never a vote (the locked "a thing we can measure from data is
 *     never a subjective vote" rule). Weight was previously being absorbed by
 *     both comfort and roomy_vs_compact, muddying both.
 *   - Vibe, colourway, material, era → CATEGORICAL. Descriptors, not scales.
 *   - Acquisition friction, SA attitude, returns/duties, repairability,
 *     counterfeit density → real drivers, but they belong to the BRAND. Attaching
 *     them per-bag would pollute every model a house makes.
 */

/**
 * Unipolar judgements: one end is better, so these render as a proportional fill.
 *
 * Deliberately only two. Most of what people discuss about a bag is either a
 * property we can derive (weight, dimensions, closure) or a description with no
 * better end. Judgements that ceiling out at the top tier were cut: build quality
 * scores 5 on every Hermès, which carries no signal.
 */
export const RATE_AXES = [
  "access",
  "price_value",
] as const;

/** Polar descriptions: neither end is better. */
export const DESCRIBE_AXES = [
  "structure",
  "holds_up",
  "dress_code",
  "worth_it_where",
] as const;

/**
 * Full votable set. Describe-first: the polar taps have no wrong answer, so they
 * warm a contributor up before the harder judgements.
 */
export const AXES = [...DESCRIBE_AXES, ...RATE_AXES] as const;

export type Axis = (typeof AXES)[number];
export type AxisKind = "rate" | "describe";

export function isAxis(value: string): value is Axis {
  return (AXES as readonly string[]).includes(value);
}

export function axisKind(axis: Axis): AxisKind {
  return (DESCRIBE_AXES as readonly string[]).includes(axis) ? "describe" : "rate";
}

export interface AxisMeta {
  label: string;
  low: string;
  high: string;
  kind: AxisKind;
  /** One line on what the axis is asking, so two raters mean the same thing. */
  hint: string;
}

/**
 * Display copy per axis. `low` and `high` are the 1 and 5 ends.
 *
 * Every `hint` exists because the evidence showed unscoped axes collect
 * different questions from different raters. The Jodie is the clearest case:
 * crook-of-arm comfort is excellent and shoulder comfort is poor on the SAME
 * bag, so an unscoped "comfort" averages to a meaningless 3.
 */
export const AXIS_META: Record<Axis, AxisMeta> = {
  // ---- Describe it (polar: neither end is better) ----
  structure: {
    label: "Structure",
    low: "Slouches",
    high: "Holds its shape",
    kind: "describe",
    hint: "Does it collapse and mould to you, or stand on its own?",
  },
  holds_up: {
    label: "How it holds up",
    low: "Baby it",
    high: "Live in it",
    kind: "describe",
    hint: "Do you have to be careful with it, or can you stop thinking about it?",
  },
  dress_code: {
    label: "Dress code",
    low: "Casual",
    high: "Dressy",
    kind: "describe",
    hint: "Where does it feel right, errands or evening?",
  },
  worth_it_where: {
    label: "Worth it where",
    low: "Only preloved",
    high: "Worth full retail",
    kind: "describe",
    hint: "Would you pay boutique price, or only buy this one secondhand?",
  },

  // ---- Rate it (unipolar: one end is better) ----
  access: {
    label: "Getting in",
    low: "Fussy",
    high: "Easy in and out",
    kind: "rate",
    hint: "How easily do you get at your things? How secure it is comes from the closure, not this.",
  },
  price_value: {
    label: "Price value",
    low: "Way overpriced",
    high: "Great value",
    kind: "rate",
    hint: "What it costs against what you get. Not whether you like it.",
  },
};
