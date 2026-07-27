import { describe, it, expect } from "vitest";
import { describeTrend, TREND_MIN_MONTHS, TREND_NOISE_FLOOR } from "../bag-trend";

const s = (...pairs: [string, number][]) => pairs.map(([month, rank]) => ({ month, rank }));

describe("describeTrend", () => {
  it("says nothing with a single month", () => {
    // One point is a position, not a trend. Claiming direction from it would be
    // inventing information.
    const t = describeTrend(s(["2026-08-01", 40]));
    expect(t.direction).toBe("unknown");
    expect(t.label).toBeNull();
  });

  it("treats a falling rank NUMBER as a climbing bag", () => {
    // Rank 1 is the top. Getting this inversion wrong would tell every reader the
    // exact opposite of the truth.
    const t = describeTrend(s(["2026-08-01", 40], ["2026-09-01", 25]));
    expect(t.direction).toBe("climbing");
    expect(t.placesMoved).toBe(15);
    expect(t.label).toBe("Heating up, up 15 places over 2 months");
  });

  it("calls a rising rank number cooling", () => {
    const t = describeTrend(s(["2026-08-01", 12], ["2026-09-01", 30]));
    expect(t.direction).toBe("cooling");
    expect(t.label).toBe("Cooling off, down 18 places over 2 months");
  });

  it("ignores movement under the noise floor", () => {
    // A two-place drift month to month is churn in the underlying data, not a bag
    // going out of fashion.
    const t = describeTrend(s(["2026-08-01", 20], ["2026-09-01", 22]));
    expect(t.direction).toBe("steady");
    expect(t.label).toBe("Steady, across 2 months");
  });

  it("sorts an out-of-order series before reading direction", () => {
    const t = describeTrend(s(["2026-10-01", 10], ["2026-08-01", 40], ["2026-09-01", 25]));
    expect(t.direction).toBe("climbing");
    expect(t.placesMoved).toBe(30);
    expect(t.currentRank).toBe(10);
  });

  it("returns the series oldest first, ready for a sparkline", () => {
    const t = describeTrend(s(["2026-10-01", 10], ["2026-08-01", 40]));
    expect(t.series.map((p) => p.month)).toEqual(["2026-08-01", "2026-10-01"]);
  });

  it("keeps the thresholds honest", () => {
    // Guards the design decision: never characterise from one point, and never
    // dress up single-place churn as a trend.
    expect(TREND_MIN_MONTHS).toBeGreaterThanOrEqual(2);
    expect(TREND_NOISE_FLOOR).toBeGreaterThan(1);
  });
});
