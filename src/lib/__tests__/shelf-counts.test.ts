import { describe, it, expect } from "vitest";
import { shelfCountsFrom } from "../demand";

describe("shelfCountsFrom", () => {
  it("totals the three states", () => {
    expect(shelfCountsFrom(30, 12, 4).total).toBe(46);
  });

  it("computes wants per owner", () => {
    expect(shelfCountsFrom(30, 12, 0).covetRatio).toBe(2.5);
  });

  it("returns null coverage ratio when nobody owns it", () => {
    // Not Infinity: a ratio against zero owners is meaningless, not enormous.
    expect(shelfCountsFrom(30, 0, 0).covetRatio).toBeNull();
  });

  it("handles an empty shelf without dividing by zero", () => {
    const c = shelfCountsFrom(0, 0, 0);
    expect(c.total).toBe(0);
    expect(c.covetRatio).toBeNull();
  });

  it("counts 'had' toward the total but not the covet ratio", () => {
    // Past owners are real signal, but coveting is about want vs current owners.
    const c = shelfCountsFrom(10, 10, 50);
    expect(c.total).toBe(70);
    expect(c.covetRatio).toBe(1);
  });
});
