import { describe, it, expect } from "vitest";
import {
  emptyCanvas,
  canvasCompleteness,
  nextAsk,
  isPrivate,
  CANVAS_VISIBILITY,
} from "../bag-canvas";

describe("canvas visibility", () => {
  it("keeps everything money-adjacent private", () => {
    expect(isPrivate("purchasePrice")).toBe(true);
    expect(isPrivate("purchaseYear")).toBe(true);
    expect(isPrivate("purchaseChannel")).toBe(true);
  });

  it("keeps the personal note private and the review public", () => {
    expect(isPrivate("note")).toBe(true);
    expect(isPrivate("reviewBody")).toBe(false);
  });

  it("keeps why you no longer have it private", () => {
    // "Sold it" is nobody else's business at the individual level.
    expect(isPrivate("hadReason")).toBe(true);
  });

  it("declares a visibility for every field, so nothing is ambiguous", () => {
    for (const [field, v] of Object.entries(CANVAS_VISIBILITY)) {
      expect(["public", "private"], `${field} must declare one`).toContain(v);
    }
  });
});

describe("canvasCompleteness", () => {
  it("is zero on an untouched canvas", () => {
    expect(canvasCompleteness(emptyCanvas(1))).toBe(0);
  });

  it("counts adding the bag as real progress", () => {
    // Endowed progress: never make someone stare at 0% after doing something.
    const c = { ...emptyCanvas(1), status: "have" as const };
    expect(canvasCompleteness(c)).toBeGreaterThan(0);
  });

  it("reaches 1 without demanding photos", () => {
    const c = {
      ...emptyCanvas(1),
      status: "have" as const,
      rating: 4,
      reviewBody: "Carried it for two years.",
      axisVotes: { structure: 3 },
      purchaseYear: 2022,
    };
    expect(canvasCompleteness(c)).toBe(1);
    expect(c.photoCount).toBe(0);
  });
});

describe("nextAsk", () => {
  it("asks for the shelf state first", () => {
    expect(nextAsk(emptyCanvas(1))).toBe("status");
  });

  it("asks for scales before the written review", () => {
    // Scales aggregate across people; prose does not, so it earns its place later.
    const c = { ...emptyCanvas(1), status: "have" as const, rating: 5 };
    expect(nextAsk(c)).toBe("axisVotes");
  });

  it("leaves the purchase year until last", () => {
    const c = {
      ...emptyCanvas(1),
      status: "have" as const,
      rating: 5,
      axisVotes: { structure: 4 },
      reviewBody: "Good bag.",
    };
    expect(nextAsk(c)).toBe("purchaseYear");
  });

  it("stops asking once the canvas is complete", () => {
    const c = {
      ...emptyCanvas(1),
      status: "have" as const,
      rating: 5,
      axisVotes: { structure: 4 },
      reviewBody: "Good bag.",
      purchaseYear: 2021,
    };
    expect(nextAsk(c)).toBeNull();
  });
});
