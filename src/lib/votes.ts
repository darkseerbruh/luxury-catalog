import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

/**
 * Multi-axis subjective voting reads, built on the 0012 schema. Degrades to an
 * empty/honest state when Supabase env or the migration is absent — the cloud
 * build has no DB credentials (mirrors reviews.ts / social.ts).
 */

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** The fixed axis vocabulary — must match the `bag_axis` enum in 0012. */
export const AXES = [
  "build_quality",
  "everyday_wearability",
  "holds_value",
  "roomy_vs_compact",
  "comfort",
  "versatility",
  "worth_the_price",
] as const;

export type Axis = (typeof AXES)[number];

export function isAxis(value: string): value is Axis {
  return (AXES as readonly string[]).includes(value);
}

/** Display copy per axis. For roomy_vs_compact the scale is bipolar (low→high). */
export const AXIS_META: Record<Axis, { label: string; low: string; high: string }> = {
  build_quality: { label: "Build quality", low: "Flimsy", high: "Tank-like" },
  everyday_wearability: { label: "Everyday wearability", low: "Occasion-only", high: "Daily driver" },
  holds_value: { label: "Holds value", low: "Depreciates", high: "Holds / appreciates" },
  roomy_vs_compact: { label: "Roomy vs compact", low: "Compact", high: "Roomy" },
  comfort: { label: "Comfort to carry", low: "Awkward", high: "Effortless" },
  versatility: { label: "Versatility", low: "One-note", high: "Goes with anything" },
  worth_the_price: { label: "Worth the price", low: "Overpriced", high: "Worth every cent" },
};

export interface AxisAggregate {
  axis: Axis;
  label: string;
  low: string;
  high: string;
  /** Average 1..5 (1 dp), or null when no votes. */
  average: number | null;
  count: number;
  /** The current user's own vote on this axis, or null. */
  myValue: number | null;
}

export interface AxisVoteSummary {
  axes: AxisAggregate[];
  totalVotes: number;
  signedIn: boolean;
}

function emptySummary(signedIn: boolean): AxisVoteSummary {
  return {
    axes: AXES.map((axis) => ({
      axis,
      label: AXIS_META[axis].label,
      low: AXIS_META[axis].low,
      high: AXIS_META[axis].high,
      average: null,
      count: 0,
      myValue: null,
    })),
    totalVotes: 0,
    signedIn,
  };
}

/**
 * Per-axis average + count for a variant, plus the viewer's own votes. Reads
 * every vote row for the variant (public RLS) and aggregates in JS, exactly like
 * getReviews() computes its average client-side. Always returns the full fixed
 * axis set so the UI can render an honest empty bar where an axis has no votes.
 */
export async function getAxisVotes(variantId: number): Promise<AxisVoteSummary> {
  const user = await getCurrentUser();
  const signedIn = Boolean(user);
  if (!hasSupabase()) return emptySummary(signedIn);

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("bag_axis_vote")
    .select("user_id, axis, value")
    .eq("variant_id", variantId)
    .limit(5000);

  if (error || !data) return emptySummary(signedIn);

  const rows = data as { user_id: string; axis: string; value: number }[];

  const sums = new Map<Axis, { sum: number; count: number }>();
  const mine = new Map<Axis, number>();
  for (const r of rows) {
    if (!isAxis(r.axis)) continue;
    const agg = sums.get(r.axis) ?? { sum: 0, count: 0 };
    agg.sum += r.value;
    agg.count += 1;
    sums.set(r.axis, agg);
    if (user && r.user_id === user.id) mine.set(r.axis, r.value);
  }

  const axes: AxisAggregate[] = AXES.map((axis) => {
    const agg = sums.get(axis);
    const average = agg && agg.count > 0 ? Math.round((agg.sum / agg.count) * 10) / 10 : null;
    return {
      axis,
      label: AXIS_META[axis].label,
      low: AXIS_META[axis].low,
      high: AXIS_META[axis].high,
      average,
      count: agg?.count ?? 0,
      myValue: mine.get(axis) ?? null,
    };
  });

  return { axes, totalVotes: rows.length, signedIn };
}
