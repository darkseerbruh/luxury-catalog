import { describe, it, expect } from "vitest";
import { demandLevel } from "../demand";

describe("demandLevel", () => {
  it("is quiet with no/low signal and has no label at zero", () => {
    expect(demandLevel(0, 0)).toMatchObject({ level: "quiet", label: null, score: 0 });
    expect(demandLevel(1, 1).level).toBe("quiet"); // score 3
  });

  it("weights wants 2x watchers", () => {
    expect(demandLevel(3, 0).score).toBe(6); // warm
    expect(demandLevel(0, 6).score).toBe(6);
    expect(demandLevel(3, 0).level).toBe("warm");
  });

  it("goes hot past the threshold", () => {
    expect(demandLevel(10, 0).level).toBe("hot"); // score 20
    expect(demandLevel(8, 5).level).toBe("hot"); // score 21
  });

  it("builds an honest label with singular/plural", () => {
    expect(demandLevel(1, 0).label).toBe("1 wants it");
    expect(demandLevel(5, 3).label).toBe("5 want it · 3 watching");
    expect(demandLevel(0, 2).label).toBe("2 watching");
  });
});
