/**
 * Is this bag having a moment, or is it steady?
 *
 * WHY THIS IS DERIVED AND NOT ASKED (owner, 2026-07-26). Trend was nearly built as
 * an owner scale until she pointed out the flaw: reputation heats and cools, so a
 * static average is meaningless. Her examples were the Celine Luggage and the Boy,
 * both of which would have collected votes at their peak that would still be sitting
 * on the page today describing a room that has moved on.
 *
 * A vote cast in 2019 and a vote cast in 2026 are not two opinions about one thing.
 * They are two different facts about two different moments. Averaging them destroys
 * the only information that mattered, which is the DIRECTION.
 *
 * So we never ask. We read it from `lc_index_snapshot`, which already records each
 * style's rank once a month, and report movement rather than a position.
 *
 * WHEN THIS LIGHTS UP. The snapshot table is empty as of 2026-07-26, because the LC
 * Index was silently returning zero rows until it was repaired earlier that day, so
 * the 1 July run had nothing to capture. The cron is scheduled (`0 7 1 * *`) and the
 * index is healthy again (928 styles in 0.29s, verified). So: first snapshot 1 Aug,
 * and a trend needs two of them, which makes 1 Sept the earliest this can render.
 * Everything below returns "not enough history yet" until then, by design.
 */

import { getSupabase } from "./supabase";

/** Months of history required before we will characterise a direction at all. */
export const TREND_MIN_MONTHS = 2;

/** Rank places moved before we call it movement rather than noise. */
export const TREND_NOISE_FLOOR = 3;

export type TrendDirection = "climbing" | "steady" | "cooling" | "unknown";

/**
 * On-page copy.
 *
 * ⚠️ NAMED FOR WHAT IT ACTUALLY MEASURES. This was briefly labelled "Attention over
 * time", which was wrong: it reads LC Index rank, and the index is price 0.47 /
 * trade 0.29 / scarcity 0.24. That is MARKET STANDING, not attention. Publishing it
 * as attention would have been a quiet lie on every bag page.
 *
 * A real attention series was investigated and is NOT viable on a free path. Google
 * Trends has no official API; its unofficial endpoint answers the "explore" step but
 * returns 429 on the data step from a residential IP AND from a GitHub Actions
 * runner (both probed 2026-07-27). Getting genuine attention data needs a paid
 * transport (an Apify Trends actor, or SerpAPI). Until that exists, this module
 * describes standing and says so.
 */
export const TREND_MODULE_LABEL = "Where it stands, over time";
export const TREND_HEDGE = "How its place in the index has moved. A read on the market, not on how many people are talking about it.";
export const TREND_EMPTY = "Not enough reads yet. Tell us how this one feels right now.";

/** Reader-facing word per direction. "Steady" is a real third answer, not a midpoint. */
export const TREND_WORD: Record<Exclude<TrendDirection, "unknown">, string> = {
  climbing: "Heating up",
  steady: "Steady",
  cooling: "Cooling off",
};

export interface BagTrend {
  direction: TrendDirection;
  /** Positive means the bag moved UP the ranking (toward rank 1). */
  placesMoved: number;
  monthsOfHistory: number;
  currentRank: number | null;
  /** Honest label, or null when there is not enough history to say anything. */
  label: string | null;
  /** The full series, oldest first, for a sparkline. */
  series: { month: string; rank: number }[];
}

const NO_TREND: BagTrend = {
  direction: "unknown",
  placesMoved: 0,
  monthsOfHistory: 0,
  currentRank: null,
  label: null,
  series: [],
};

/**
 * Characterise a rank series.
 *
 * Pure, so the thresholds are testable without a database. Note the inversion: rank
 * 1 is the top, so a FALLING rank number is a RISING bag, and getting that backwards
 * would tell every reader the opposite of the truth.
 */
export function describeTrend(series: { month: string; rank: number }[]): BagTrend {
  if (series.length < TREND_MIN_MONTHS) {
    return { ...NO_TREND, monthsOfHistory: series.length, series };
  }
  const sorted = [...series].sort((a, b) => a.month.localeCompare(b.month));
  const first = sorted[0].rank;
  const last = sorted[sorted.length - 1].rank;

  // Rank 1 is the top, so a decrease in the number is an increase in standing.
  const placesMoved = first - last;

  let direction: TrendDirection;
  if (Math.abs(placesMoved) < TREND_NOISE_FLOOR) direction = "steady";
  else direction = placesMoved > 0 ? "climbing" : "cooling";

  const n = Math.abs(placesMoved);
  const span = sorted.length;
  // Lead with the reader-facing word, then the evidence behind it. Never an arrow
  // or a percentage on its own: a bare ▲ implies a precision this does not have.
  const label =
    direction === "steady"
      ? `${TREND_WORD.steady}, across ${span} months`
      : direction === "climbing"
        ? `${TREND_WORD.climbing}, up ${n} places over ${span} months`
        : `${TREND_WORD.cooling}, down ${n} places over ${span} months`;

  return {
    direction,
    placesMoved,
    monthsOfHistory: span,
    currentRank: last,
    label,
    series: sorted,
  };
}

/**
 * Read a style's rank history. Degrades to "no trend" on any failure, matching the
 * resilient-read pattern used across the bag page, so a missing table or a slow
 * query never breaks a page over a nice-to-have.
 */
export async function getBagTrend(styleId: number, months = 12): Promise<BagTrend> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NO_TREND;
  try {
    const { data, error } = await getSupabase()
      .from("lc_index_snapshot")
      .select("captured_month, rank")
      .eq("style_id", styleId)
      .order("captured_month", { ascending: false })
      .limit(months);
    if (error || !data) return NO_TREND;
    return describeTrend(
      (data as { captured_month: string; rank: number }[]).map((r) => ({
        month: r.captured_month,
        rank: r.rank,
      })),
    );
  } catch {
    return NO_TREND;
  }
}
