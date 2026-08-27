import { describe, expect, it } from "vitest";

import {
  GRADUATION_STREAK,
  SOURCES,
  emptyState,
  median,
  nextCadence,
  nextFindings,
  nextState,
  overallStatus,
  parseState,
  percentile,
  redIssuePayload,
  renderReport,
  renderWorklistSection,
  scoreBacklogGrowth,
  scoreCadenceAudit,
  scoreContamination,
  scoreMisattachment,
  scoreSizeMismatch,
  scoreCoverageDelta,
  scoreDuplicates,
  scoreFreshness,
  scoreRankedCount,
  scoreRowsAdded,
  scoreSnapshotAge,
  scoreSummaryStaleness,
  spliceWorklist,
  WORKLIST_BEGIN,
  WORKLIST_END,
  type CheckResult,
} from "../data-health-core";

const TODAY = "2026-07-10";

const fp = SOURCES.find((s) => s.id === "fashionphile")!;
const trr = SOURCES.find((s) => s.id === "therealreal")!;
const ebay = SOURCES.find((s) => s.id === "ebay")!;
const tlc = SOURCES.find((s) => s.id === "tlc")!;

function check(id: string, status: CheckResult["status"], metric?: number): CheckResult {
  return { id, label: id, status, value: String(metric ?? ""), metric, plainEnglish: status === "green" ? "" : `${id} problem.`, action: "fix it" };
}

describe("percentile / median", () => {
  it("nearest-rank percentiles", () => {
    const v = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(v, 10)).toBe(1);
    expect(percentile(v, 50)).toBe(5);
    expect(percentile(v, 100)).toBe(10);
    expect(median([3, 1, 2])).toBe(2);
  });
  it("null on empty", () => {
    expect(percentile([], 10)).toBeNull();
    expect(median([])).toBeNull();
  });
});

describe("scoreFreshness", () => {
  it("green at the promised cadence, yellow past it, red past the yellow bound", () => {
    expect(scoreFreshness(fp, 1).status).toBe("green");
    expect(scoreFreshness(fp, 2).status).toBe("yellow");
    expect(scoreFreshness(fp, 3).status).toBe("red");
    expect(scoreFreshness(tlc, 2).status).toBe("green");
    expect(scoreFreshness(tlc, 3).status).toBe("yellow");
    expect(scoreFreshness(tlc, 4).status).toBe("red");
  });
  it("a paused source is info-only and says why, so it stops crying wolf", () => {
    // TRR's capture was pulled 2026-08-02 in the cost review. Scoring it made the
    // scorecard RED daily for a deliberate decision.
    expect(scoreFreshness(trr, 30).status).toBe("info");
    expect(scoreFreshness(trr, null).status).toBe("info");
    expect(scoreFreshness(trr, 30).value).toContain("paused");
    expect(scoreCadenceAudit(trr, []).value).toContain("paused");
  });
  it("eBay is info-only regardless of age", () => {
    expect(scoreFreshness(ebay, 400).status).toBe("info");
    expect(scoreFreshness(ebay, null).status).toBe("info");
  });
  it("no rows at all on a scored source = red", () => {
    expect(scoreFreshness(fp, null).status).toBe("red");
  });
});

describe("scoreRowsAdded", () => {
  it("red on zero", () => {
    expect(scoreRowsAdded(0, [400, 500]).status).toBe("red");
  });
  it("yellow on a >5x explosion vs the recent baseline", () => {
    expect(scoreRowsAdded(2600, [500, 500, 500]).status).toBe("yellow");
    expect(scoreRowsAdded(2400, [500, 500, 500]).status).toBe("green");
  });
  it("green with no history yet (first runs)", () => {
    expect(scoreRowsAdded(1234, []).status).toBe("green");
  });
});

describe("scoreRankedCount", () => {
  it("red on a >10% drop, yellow on any drop, green otherwise", () => {
    expect(scoreRankedCount(199, 222).status).toBe("red");
    expect(scoreRankedCount(221, 222).status).toBe("yellow");
    expect(scoreRankedCount(222, 222).status).toBe("green");
    expect(scoreRankedCount(230, 222).status).toBe("green");
  });
  it("first run (no previous) is green", () => {
    expect(scoreRankedCount(222, null).status).toBe("green");
  });
});

describe("scoreSnapshotAge", () => {
  it("this month or last month = green", () => {
    expect(scoreSnapshotAge("2026-07-01", TODAY).status).toBe("green");
    expect(scoreSnapshotAge("2026-06-01", TODAY).status).toBe("green");
  });
  it("two months behind = red, none = yellow", () => {
    expect(scoreSnapshotAge("2026-05-01", TODAY).status).toBe("red");
    expect(scoreSnapshotAge(null, TODAY).status).toBe("yellow");
  });
});

describe("scoreCoverageDelta", () => {
  it("delta-scored: red >=5pt drop, yellow >=2pt, green small moves and first run", () => {
    expect(scoreCoverageDelta("c", "C", 66, 71.5, "a").status).toBe("red");
    expect(scoreCoverageDelta("c", "C", 69, 71.5, "a").status).toBe("yellow");
    expect(scoreCoverageDelta("c", "C", 70.5, 71.5, "a").status).toBe("green");
    expect(scoreCoverageDelta("c", "C", 12, null, "a").status).toBe("green");
    expect(scoreCoverageDelta("c", "C", 80, 71.5, "a").status).toBe("green");
  });
});

describe("scoreBacklogGrowth", () => {
  it("yellow >10% growth, red >25%", () => {
    expect(scoreBacklogGrowth(50000, 41000).status).toBe("yellow");
    expect(scoreBacklogGrowth(52000, 41000).status).toBe("red");
    expect(scoreBacklogGrowth(42000, 41000).status).toBe("green");
    expect(scoreBacklogGrowth(42000, null).status).toBe("green");
  });
});

describe("contamination sentinels", () => {
  it("TRR leak-back thresholds", () => {
    expect(scoreContamination(0, 900).status).toBe("green");
    expect(scoreContamination(1, 900).status).toBe("yellow");
    expect(scoreContamination(21, 900).status).toBe("red");
  });
  it("same-day duplicate thresholds", () => {
    expect(scoreDuplicates(0).status).toBe("green");
    expect(scoreDuplicates(1).status).toBe("yellow");
    expect(scoreDuplicates(101).status).toBe("red");
  });
  it("size-mismatch thresholds", () => {
    expect(scoreSizeMismatch(0, 5000).status).toBe("green");
    expect(scoreSizeMismatch(1, 5000).status).toBe("yellow");
    expect(scoreSizeMismatch(41, 5000).status).toBe("red");
  });
  it("misattachment scores on the precise accessory signal, not noisy wrong-model", () => {
    expect(scoreMisattachment(0, 0, 5000).status).toBe("green");
    expect(scoreMisattachment(1, 0, 5000).status).toBe("yellow");
    expect(scoreMisattachment(16, 0, 5000).status).toBe("red");
    // wrong-model is review context only (dictionary ordering still misfires), so a
    // wrong-model spike alone must NOT flag the routine red/yellow.
    expect(scoreMisattachment(0, 200, 5000).status).toBe("green");
    expect(scoreMisattachment(0, 200, 5000).metric).toBe(0);
  });
});

describe("scoreSummaryStaleness", () => {
  it("yellow only when stale AND rows are landing", () => {
    expect(scoreSummaryStaleness(48, 500).status).toBe("yellow");
    expect(scoreSummaryStaleness(48, 0).status).toBe("green");
    expect(scoreSummaryStaleness(10, 500).status).toBe("green");
    expect(scoreSummaryStaleness(null, 500).status).toBe("green");
  });
});

describe("scoreCadenceAudit", () => {
  const lifetimes = Array.from({ length: 100 }, (_, i) => i + 1); // p10 = 10d
  it("yellow when configured interval exceeds the p10 lifetime", () => {
    const slow = { ...trr, configuredIntervalDays: 14 };
    expect(scoreCadenceAudit(slow, lifetimes).status).toBe("yellow");
  });
  it("green when the interval is within the churn window", () => {
    expect(scoreCadenceAudit({ ...trr, configuredIntervalDays: 5 }, lifetimes).status).toBe("green");
  });
  it("info when much faster than needed", () => {
    expect(scoreCadenceAudit({ ...trr, configuredIntervalDays: 2 }, lifetimes).status).toBe("info");
  });
  it("info (not yellow) when churn beats the interval but daily is already the practical floor", () => {
    // p10 lifetime = 0 days (same-day churn) on a source already refreshed daily:
    // no actionable tightening exists, so it is an honest known loss, not a flag.
    const sameDay = Array.from({ length: 40 }, (_, i) => (i < 8 ? 0 : i));
    const r = scoreCadenceAudit({ ...trr, configuredIntervalDays: 1 }, sameDay);
    expect(r.status).toBe("info");
    expect(r.plainEnglish).toContain("known, accepted loss");
  });
  it("info on a thin sample or an exempt (dispatch-only) source", () => {
    expect(scoreCadenceAudit(trr, [1, 2, 3]).status).toBe("info");
    expect(scoreCadenceAudit(ebay, lifetimes).status).toBe("info");
  });
});

describe("overallStatus", () => {
  it("worst non-info wins; info never dirties green", () => {
    expect(overallStatus([check("a", "green"), check("b", "info")])).toBe("green");
    expect(overallStatus([check("a", "green"), check("b", "yellow")])).toBe("yellow");
    expect(overallStatus([check("a", "yellow"), check("b", "red")])).toBe("red");
    expect(overallStatus([])).toBe("green");
  });
});

describe("nextCadence (graduation state machine)", () => {
  it("streak 6 -> 7 graduates daily to weekly with an announcement", () => {
    const t = nextCadence({ cadence: "daily", greenStreak: GRADUATION_STREAK - 1 }, "green");
    expect(t.cadence).toBe("weekly");
    expect(t.greenStreak).toBe(GRADUATION_STREAK);
    expect(t.announcement).toContain("WEEKLY");
  });
  it("green below the streak stays daily", () => {
    const t = nextCadence({ cadence: "daily", greenStreak: 2 }, "green");
    expect(t.cadence).toBe("daily");
    expect(t.greenStreak).toBe(3);
    expect(t.announcement).toBeNull();
  });
  it("red on weekly demotes to daily and zeroes the streak", () => {
    const t = nextCadence({ cadence: "weekly", greenStreak: 9 }, "red");
    expect(t.cadence).toBe("daily");
    expect(t.greenStreak).toBe(0);
    expect(t.announcement).toContain("DAILY");
  });
  it("yellow resets the streak without demoting", () => {
    const t = nextCadence({ cadence: "weekly", greenStreak: 9 }, "yellow");
    expect(t.cadence).toBe("weekly");
    expect(t.greenStreak).toBe(0);
    expect(t.announcement).toBeNull();
  });
  it("red on daily zeroes the streak silently", () => {
    const t = nextCadence({ cadence: "daily", greenStreak: 4 }, "red");
    expect(t.cadence).toBe("daily");
    expect(t.greenStreak).toBe(0);
    expect(t.announcement).toBeNull();
  });
});

describe("findings lifecycle + worklist rendering", () => {
  it("keeps firstSeen on persisting findings and resolves greens", () => {
    const prev = { "freshness-tlc": { firstSeen: "2026-07-08", status: "yellow" as const } };
    const checks = [check("freshness-tlc", "yellow"), check("capture-rows", "green")];
    const { open, resolved } = nextFindings(prev, checks, TODAY);
    expect(open["freshness-tlc"].firstSeen).toBe("2026-07-08");
    expect(resolved).toEqual([]);

    const healed = nextFindings(prev, [check("freshness-tlc", "green")], TODAY);
    expect(healed.open).toEqual({});
    expect(healed.resolved).toEqual(["freshness-tlc"]);
  });

  it("renders open items with the [dh:id] dedupe key and resolved items once", () => {
    const checks = [check("freshness-tlc", "yellow"), check("capture-rows", "green")];
    const { open, resolved } = nextFindings(
      { "capture-rows": { firstSeen: "2026-07-01", status: "red" } },
      checks,
      TODAY,
    );
    const body = renderWorklistSection(checks, open, resolved, TODAY);
    expect(body).toContain("[dh:freshness-tlc]");
    expect(body).toContain("first seen 2026-07-10");
    expect(body).toContain("✅ [dh:capture-rows] resolved 2026-07-10");
  });

  it("says clean when nothing is open", () => {
    const body = renderWorklistSection([], {}, [], TODAY);
    expect(body).toContain("nothing open");
  });
});

describe("spliceWorklist", () => {
  it("appends the block when markers are missing, replaces in place when present", () => {
    const original = "# Worklist\n\n- item one\n";
    const first = spliceWorklist(original, "body v1");
    expect(first).toContain("# Worklist");
    expect(first).toContain("body v1");
    expect(first.indexOf(WORKLIST_BEGIN)).toBeGreaterThan(first.indexOf("- item one"));

    const second = spliceWorklist(first, "body v2");
    expect(second).toContain("body v2");
    expect(second).not.toContain("body v1");
    // Nothing outside the markers changed, and only one block exists.
    expect(second.split(WORKLIST_BEGIN)).toHaveLength(2);
    expect(second.split(WORKLIST_END)).toHaveLength(2);
    expect(second).toContain("- item one");
  });
});

describe("redIssuePayload", () => {
  it("one deterministic-title payload per red check, none for yellow/green", () => {
    const payload = redIssuePayload(
      [check("freshness-fashionphile", "red"), check("backlog-total", "yellow"), check("capture-rows", "green")],
      TODAY,
    );
    expect(payload).toHaveLength(1);
    expect(payload[0].title).toBe("Data health: freshness-fashionphile is RED");
    expect(payload[0].body).toContain(`reports/data-health/${TODAY}.md`);
  });
});

describe("renderReport", () => {
  it("leads with the score line and lists only yellow/red under attention", () => {
    const md = renderReport({
      today: TODAY,
      checks: [check("a", "green", 5), check("b", "yellow", 3), check("c", "info")],
      overall: "yellow",
      cadence: "daily",
      greenStreak: 0,
      announcement: null,
      autoFixes: ["refreshed variant_price_summary"],
    });
    expect(md.startsWith(`# Data health — ${TODAY} — 🟡 YELLOW`)).toBe(true);
    expect(md).toContain("## What needs attention");
    expect(md).toContain("b problem.");
    expect(md).not.toContain("a problem.");
    expect(md).toContain("Auto-fixed this run");
  });

  it("announces cadence transitions", () => {
    const md = renderReport({
      today: TODAY,
      checks: [check("a", "green")],
      overall: "green",
      cadence: "weekly",
      greenStreak: 7,
      announcement: "graduated",
      autoFixes: [],
    });
    expect(md).toContain("> graduated");
    expect(md).toContain("(weekly cadence)");
  });
});

describe("state round-trip", () => {
  it("nextState persists metrics, findings, rowsAddedHistory and survives parse", () => {
    const prev = emptyState("2026-07-09");
    prev.findings = { "backlog-total": { firstSeen: "2026-07-01", status: "yellow" } };
    prev.rowsAddedHistory = [100, 200];
    const checks = [check("backlog-total", "yellow", 45000), check("capture-rows", "green", 300)];
    const t = nextCadence(prev, overallStatus(checks));
    const s = nextState(prev, TODAY, checks, t, 300);

    expect(s.metrics["backlog-total"]).toBe(45000);
    expect(s.findings["backlog-total"].firstSeen).toBe("2026-07-01");
    expect(s.rowsAddedHistory).toEqual([100, 200, 300]);
    expect(s.overall).toBe("yellow");
    expect(s.greenStreak).toBe(0);

    const parsed = parseState(JSON.stringify(s));
    expect(parsed).toEqual(s);
  });

  it("rejects unknown versions and garbage", () => {
    expect(parseState('{"version":2,"cadence":"daily"}')).toBeNull();
    expect(parseState("not json")).toBeNull();
    expect(parseState('{"version":1,"cadence":"hourly"}')).toBeNull();
  });
});
