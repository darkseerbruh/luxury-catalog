/**
 * The taste model — shared by the quiz (build-order #3), recommendations (#4)
 * and the Taste Map (#5).
 *
 * A taste vector is a map of dimension -> { value: weight }. Weights accumulate
 * from quiz answers, closet, and watchlist. EVERY dimension and value here is a
 * real, catalogued attribute (silhouette enum, size_category enum, carry types,
 * hardware colors, material types, the onboarding persona) — never invented.
 * Recommendations reason only over these, leaving gaps empty.
 */

export type TasteDimension =
  | "silhouette"
  | "size"
  | "carry"
  | "hardware"
  | "material"
  | "formality"
  | "price_band"
  | "brand";

/** value -> accumulated weight (>0). */
export type DimensionWeights = Record<string, number>;
export type TasteVector = Partial<Record<TasteDimension, DimensionWeights>>;

export interface TasteQuizOption {
  /** The catalogued value this answer maps to. */
  value: string;
  label: string;
  /** Optional secondary dimensions this answer also informs. */
  also?: { dimension: TasteDimension; value: string }[];
}

export interface TasteQuizQuestion {
  id: string;
  dimension: TasteDimension;
  prompt: string;
  options: TasteQuizOption[];
}

/**
 * The either/or question set. Values match catalog vocabulary:
 *  - silhouette: silhouette_type enum (structured/slouchy/box/hobo/tote/clutch)
 *  - size: size_category enum (mini/small/medium/large)
 *  - carry: carry_method.carry_type tokens (top handle/shoulder/crossbody/...)
 *  - hardware: variant.hardware_color (gold/silver)
 *  - material: material.material_type (leather/exotic/fabric/coated canvas)
 *  - formality / price_band: derived bands used for ranking
 *  - brand: brand affinity (free, resolved against catalogued brand names)
 */
export const TASTE_QUESTIONS: TasteQuizQuestion[] = [
  {
    id: "silhouette",
    dimension: "silhouette",
    prompt: "Which shape speaks to you?",
    options: [
      { value: "structured", label: "Crisp & structured", also: [{ dimension: "formality", value: "formal" }] },
      { value: "slouchy", label: "Soft & slouchy", also: [{ dimension: "formality", value: "casual" }] },
    ],
  },
  {
    id: "silhouette_2",
    dimension: "silhouette",
    prompt: "Pick a profile.",
    options: [
      { value: "tote", label: "Roomy tote" },
      { value: "box", label: "Neat little box" },
    ],
  },
  {
    id: "size",
    dimension: "size",
    prompt: "How much do you carry?",
    options: [
      { value: "mini", label: "Just the essentials (mini)" },
      { value: "large", label: "My whole life (large)" },
    ],
  },
  {
    id: "size_2",
    dimension: "size",
    prompt: "Everyday size?",
    options: [
      { value: "small", label: "Small & light" },
      { value: "medium", label: "Medium, do-it-all" },
    ],
  },
  {
    id: "carry",
    dimension: "carry",
    prompt: "How do you like to carry?",
    options: [
      { value: "top handle", label: "Top handle, in hand" },
      { value: "crossbody", label: "Crossbody, hands free" },
    ],
  },
  {
    id: "carry_2",
    dimension: "carry",
    prompt: "And on a busy day?",
    options: [
      { value: "shoulder", label: "Over the shoulder" },
      { value: "backpack", label: "On my back" },
    ],
  },
  {
    id: "hardware",
    dimension: "hardware",
    prompt: "Your metal?",
    options: [
      { value: "gold", label: "Warm gold" },
      { value: "silver", label: "Cool silver" },
    ],
  },
  {
    id: "material",
    dimension: "material",
    prompt: "Pick a finish.",
    options: [
      { value: "leather", label: "Smooth leather" },
      { value: "coated canvas", label: "Coated canvas / signature print" },
    ],
  },
  {
    id: "material_2",
    dimension: "material",
    prompt: "Statement or subtle?",
    options: [
      { value: "exotic", label: "Exotic & rare" },
      { value: "fabric", label: "Soft fabric / nylon" },
    ],
  },
  {
    id: "formality",
    dimension: "formality",
    prompt: "Where does it go?",
    options: [
      { value: "formal", label: "Evenings & occasions" },
      { value: "casual", label: "Daily & errands" },
    ],
  },
  {
    id: "price_band",
    dimension: "price_band",
    prompt: "Investment level?",
    options: [
      { value: "entry", label: "Smart & attainable" },
      { value: "grail", label: "Once-in-a-lifetime grail", also: [{ dimension: "formality", value: "formal" }] },
    ],
  },
];

/** Price bands by retail price, for the price_band dimension. */
export function priceBand(retail: number | null): string | null {
  if (retail == null) return null;
  if (retail < 1500) return "entry";
  if (retail < 5000) return "mid";
  return "grail";
}

/** Add weight to a dimension/value in a vector (mutating helper). */
export function addWeight(vec: TasteVector, dim: TasteDimension, value: string, w = 1): void {
  if (!value) return;
  const v = value.toLowerCase().trim();
  if (!v) return;
  const bucket = (vec[dim] ??= {});
  bucket[v] = (bucket[v] ?? 0) + w;
}

/** The top value for a dimension, or null. */
export function topValue(vec: TasteVector, dim: TasteDimension): string | null {
  const bucket = vec[dim];
  if (!bucket) return null;
  let best: string | null = null;
  let bestW = -Infinity;
  for (const [k, w] of Object.entries(bucket)) {
    if (w > bestW) {
      best = k;
      bestW = w;
    }
  }
  return best;
}

/** Top values for a dimension with normalized share (0..1), strongest first. */
export function topValuesWithShare(
  vec: TasteVector,
  dim: TasteDimension,
  max = 3
): { value: string; share: number }[] {
  const bucket = vec[dim];
  if (!bucket) return [];
  const total = Object.values(bucket).reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  return Object.entries(bucket)
    .map(([value, w]) => ({ value, share: w / total }))
    .sort((a, b) => b.share - a.share)
    .slice(0, max);
}

/** The number of distinct catalog dimensions that have any signal. */
export function dimensionsCovered(vec: TasteVector): number {
  return (Object.keys(vec) as TasteDimension[]).filter((d) => Object.keys(vec[d] ?? {}).length > 0).length;
}

const SCORABLE_DIMENSIONS: TasteDimension[] = [
  "silhouette", "size", "carry", "hardware", "material", "formality", "price_band", "brand",
];

/**
 * Completeness 0–100 = how many of the scorable taste dimensions have signal.
 * The Taste Map uses this for its meter and "answer N more" prompt.
 */
export function completeness(vec: TasteVector): number {
  const covered = SCORABLE_DIMENSIONS.filter((d) => Object.keys(vec[d] ?? {}).length > 0).length;
  return Math.round((covered / SCORABLE_DIMENSIONS.length) * 100);
}

/** How many more dimensions to cover for a "full" map. */
export function dimensionsRemaining(vec: TasteVector): number {
  const covered = SCORABLE_DIMENSIONS.filter((d) => Object.keys(vec[d] ?? {}).length > 0).length;
  return Math.max(0, SCORABLE_DIMENSIONS.length - covered);
}

const SILHOUETTE_ADJ: Record<string, string> = {
  structured: "Structured",
  slouchy: "Relaxed",
  box: "Architectural",
  hobo: "Easy",
  tote: "Practical",
  clutch: "Polished",
  "semi-structured": "Refined",
  "belt bag": "Sporty",
};

const FORMALITY_NOUN: Record<string, string> = {
  formal: "Classicist",
  casual: "Minimalist",
};

/**
 * A shareable named taste profile, e.g. "Structured Classicist — top-handle,
 * gold hardware". Built deterministically from the top values, never invented.
 */
export interface NamedTaste {
  name: string;
  tagline: string;
}

export function nameTaste(vec: TasteVector): NamedTaste {
  const sil = topValue(vec, "silhouette");
  const formality = topValue(vec, "formality");
  const carry = topValue(vec, "carry");
  const hardware = topValue(vec, "hardware");
  const material = topValue(vec, "material");
  const size = topValue(vec, "size");

  const adj = (sil && SILHOUETTE_ADJ[sil]) || "Eclectic";
  const noun = (formality && FORMALITY_NOUN[formality]) || "Collector";
  const name = `${adj} ${noun}`;

  const traits = [
    carry ? `${carry} carry` : null,
    hardware ? `${hardware} hardware` : null,
    material ? material : null,
    size ? `${size} size` : null,
  ].filter(Boolean);

  const tagline = traits.length ? traits.join(" · ") : "Tell us more to sharpen your taste";
  return { name, tagline };
}
