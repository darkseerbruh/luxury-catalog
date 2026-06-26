import type { PostSummary } from "./posts";

/**
 * Editorial departments for the Articles page. A department is the *kind* of
 * piece (is it real, what's it worth, which to pick, what's the market doing),
 * which is the axis readers actually browse by. We don't have a `category`
 * column on `post`, so department is derived in code: deterministic, no data
 * dependency, and corrected in ONE place (OVERRIDES below). If a `post.category`
 * column is added later, prefer it over this classifier.
 *
 * Each department carries its calibrated-hedge frame ("X, not Y") so the honesty
 * rules show up as design, per docs/preferences.md.
 */

export type DepartmentId = "authentication" | "value" | "comparisons" | "market";

export interface Department {
  id: DepartmentId;
  /** Two-digit display number, magazine-style. */
  number: string;
  /** Reader-facing name. */
  label: string;
  /** The calibrated-hedge frame, shown under the heading. X, not Y. */
  frame: string;
  /** One line for the department landing page + its meta description. */
  blurb: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "authentication",
    number: "01",
    label: "Authentication",
    frame: "Markers to check, not a verdict",
    blurb: "How to spot the real thing yourself, in plain words.",
  },
  {
    id: "value",
    number: "02",
    label: "What it's worth",
    frame: "An estimate, not an appraisal",
    blurb: "What a bag holds in resale, and whether it's worth it to you.",
  },
  {
    id: "comparisons",
    number: "03",
    label: "Comparisons",
    frame: "My take, not a directive",
    blurb: "Two bags side by side, so you can pick the one that fits.",
  },
  {
    id: "market",
    number: "04",
    label: "Market report",
    frame: "What the data shows, dated and sourced",
    blurb: "What the resale market is actually doing, from our pricing data.",
  },
];

const BY_ID = new Map<DepartmentId, Department>(DEPARTMENTS.map((d) => [d.id, d]));

/** A Department by its id, or null. Safe for untrusted ?department= values. */
export function getDepartment(id: string | null | undefined): Department | null {
  if (!id) return null;
  return BY_ID.get(id as DepartmentId) ?? null;
}

/**
 * Explicit pins for articles the keyword pass would misroute, keyed by slug.
 * The clearest case: market pieces whose titles contain "vs" ("list for vs what
 * they sell for") would read as a comparison. Edit this map to reclassify any
 * article. Unknown slugs are simply ignored, so it's safe to list slugs that may
 * not exist yet.
 */
const OVERRIDES: Record<string, DepartmentId> = {
  "asking-price-vs-sold-price": "market",
  "most-searched-vs-most-expensive-bags": "market",
  "which-accessible-bags-hold-value": "market",
  "dior-saddle-resale-price": "market",
  "does-a-smaller-bag-cost-more": "market",
  "what-a-coach-tabby-actually-sells-for": "market",
  "is-the-chanel-classic-flap-worth-it": "value",
  "where-to-sell-your-designer-bag": "value",
  "caviar-vs-lambskin-chanel-flap": "comparisons",
  "how-to-authenticate-a-coach-bag": "authentication",
};

const RX = {
  // Safety-critical, so it leads.
  authentication:
    /authenticat|\bfake\b|real or fake|real vs\.? fake|spot (a|the|fake)|red flags?|creed|date code|blind stamp|\bserial\b|how to (spot|tell)/i,
  // A bag-against-bag piece.
  comparisons: /\bvs\.?\b|versus/i,
  // A pricing / demand piece built on our data.
  market:
    /sells? for|sold for|asking price|list(ed)? for|what it costs|cost(s)? (on resale|now|more)|price data|pricing data|most[- ]wanted|most[- ]searched|search interest|holds? (its |their )?value|hold value|resale (value|reality|price)/i,
};

/**
 * Best-effort department for one article. OVERRIDES win; otherwise a keyword
 * pass over slug + title in priority order. Authentication leads (a wrong call
 * there does real harm), comparisons before market so a "vs" comparison isn't
 * read as a market piece, and "what it's worth" is the catch-all.
 */
export function classifyDepartment(post: Pick<PostSummary, "slug" | "title">): DepartmentId {
  const pinned = OVERRIDES[post.slug];
  if (pinned) return pinned;
  const hay = `${post.slug} ${post.title}`.toLowerCase();
  if (RX.authentication.test(hay)) return "authentication";
  if (RX.comparisons.test(hay)) return "comparisons";
  if (RX.market.test(hay)) return "market";
  return "value";
}
