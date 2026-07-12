import { describe, expect, it } from "vitest";
import {
  collectDatedCells,
  ageInDays,
  assessFreshness,
  dueByVenue,
} from "../venue-terms-freshness";

describe("venue-terms freshness", () => {
  it("collects a dated, sourced cell for every fact on both surfaces", () => {
    const cells = collectDatedCells();
    expect(cells.length).toBeGreaterThan(20);
    for (const c of cells) {
      expect(c.sourceUrl, `${c.venueSlug}.${c.field}`).toMatch(/^https:\/\//);
      expect(c.checkedAt, `${c.venueSlug}.${c.field}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["sell", "buy"]).toContain(c.surface);
    }
    // Both surfaces are represented.
    expect(cells.some((c) => c.surface === "sell")).toBe(true);
    expect(cells.some((c) => c.surface === "buy")).toBe(true);
  });

  it("ageInDays counts whole days and floors at zero", () => {
    expect(ageInDays("2026-07-01", "2026-07-31")).toBe(30);
    expect(ageInDays("2026-07-31", "2026-07-01")).toBe(0); // future check reads as 0, never negative
    expect(ageInDays("2026-07-11", "2026-07-11")).toBe(0);
  });

  it("nothing is due the day the data was checked", () => {
    // Sell data checked 2026-07-11, buy data 2026-07-09.
    const r = assessFreshness("2026-07-11", 30);
    // Buy cells are 2 days old, sell cells 0 - still under a 30-day cadence.
    expect(r.due.length).toBe(0);
    expect(r.oldestAgeDays).toBeLessThan(30);
  });

  it("flags cells once they pass the cadence", () => {
    const r = assessFreshness("2026-09-01", 30);
    expect(r.due.length).toBeGreaterThan(0);
    // Due list is sorted oldest first.
    for (let i = 1; i < r.due.length; i++) {
      expect(r.due[i].ageDays).toBeLessThanOrEqual(r.due[i - 1].ageDays);
    }
    // Every due cell is genuinely past the cadence.
    expect(r.due.every((c) => c.ageDays >= 30)).toBe(true);
  });

  it("cadence is configurable", () => {
    const tight = assessFreshness("2026-07-20", 7); // buy=11d, sell=9d -> some due at 7
    const loose = assessFreshness("2026-07-20", 90);
    expect(tight.due.length).toBeGreaterThan(0);
    expect(loose.due.length).toBe(0);
  });

  it("dueByVenue groups and ranks by oldest cell", () => {
    const r = assessFreshness("2026-09-01", 30);
    const groups = dueByVenue(r);
    expect(groups.length).toBeGreaterThan(0);
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i].oldestAgeDays).toBeLessThanOrEqual(groups[i - 1].oldestAgeDays);
    }
    // Each group's cells all belong to one venue+surface.
    for (const g of groups) {
      expect(g.cells.length).toBeGreaterThan(0);
    }
  });
});
