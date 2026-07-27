import { describe, it, expect } from "vitest";
import { checkinDue, mostWornRead, CHECKIN_INTERVAL_MONTHS } from "../most-worn";

const NOW = new Date("2026-07-26T12:00:00Z");

describe("checkinDue", () => {
  it("does not ask someone with too few bags", () => {
    // "Which of your two bags do you reach for" is not a useful question.
    expect(checkinDue({ ownedCount: 2, lastCheckinAt: null, now: NOW })).toEqual({
      due: false,
      reason: "too-few-bags",
    });
  });

  it("asks a qualifying member who has never been asked", () => {
    expect(checkinDue({ ownedCount: 6, lastCheckinAt: null, now: NOW })).toEqual({
      due: true,
      reason: "never-asked",
    });
  });

  it("waits out the interval", () => {
    const oneMonthAgo = "2026-06-20T00:00:00Z";
    expect(checkinDue({ ownedCount: 6, lastCheckinAt: oneMonthAgo, now: NOW }).due).toBe(false);
  });

  it("asks again once the interval has elapsed", () => {
    const longAgo = "2026-01-02T00:00:00Z"; // 6 months
    const r = checkinDue({ ownedCount: 6, lastCheckinAt: longAgo, now: NOW });
    expect(r).toEqual({ due: true, reason: "interval-elapsed" });
  });

  it("uses a months cadence, not days", () => {
    // Guards the whole point: a daily prompt only ever collects from daily visitors.
    expect(CHECKIN_INTERVAL_MONTHS).toBeGreaterThanOrEqual(3);
  });

  it("treats an unparseable date as never asked rather than crashing", () => {
    expect(checkinDue({ ownedCount: 6, lastCheckinAt: "not-a-date", now: NOW }).due).toBe(true);
  });
});

describe("mostWornRead", () => {
  it("hides below the owner floor", () => {
    // 1 of 2 would render as a triumphant 50%, which is not proof of anything.
    expect(mostWornRead(1, 2).show).toBe(false);
  });

  it("hides when nobody reaches for it, even with plenty of owners", () => {
    expect(mostWornRead(0, 30).show).toBe(false);
  });

  it("shows the absolute numbers alongside the share", () => {
    const r = mostWornRead(9, 12);
    expect(r.show).toBe(true);
    expect(r.share).toBe(75);
    expect(r.label).toBe("9 of 12 owners reach for this one");
  });

  it("never divides by zero", () => {
    expect(mostWornRead(0, 0).share).toBeNull();
  });
});
