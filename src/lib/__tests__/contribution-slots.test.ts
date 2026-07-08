import { describe, it, expect } from "vitest";
import { buildSlots } from "@/lib/contribution-slots";

describe("buildSlots", () => {
  it("offers exactly the three no-migration slots, in order", () => {
    const slots = buildSlots({ hasPhoto: false, hasReview: false, axisDone: 0, axisTotal: 5 });
    expect(slots.map((s) => s.key)).toEqual(["photo", "review", "wears"]);
  });

  it("anchors each slot to its existing control", () => {
    const slots = buildSlots({ hasPhoto: false, hasReview: false, axisDone: 0, axisTotal: 5 });
    expect(slots.map((s) => s.anchor)).toEqual(["#photos", "#reviews", "#owner-ratings"]);
  });

  it("nothing given -> every slot open", () => {
    const slots = buildSlots({ hasPhoto: false, hasReview: false, axisDone: 0, axisTotal: 5 });
    expect(slots.filter((s) => s.filled)).toHaveLength(0);
  });

  it("a single axis vote fills the 'wears' slot", () => {
    const slots = buildSlots({ hasPhoto: false, hasReview: false, axisDone: 1, axisTotal: 5 });
    const wears = slots.find((s) => s.key === "wears")!;
    expect(wears.filled).toBe(true);
    expect(wears.sub).toEqual({ done: 1, total: 5 });
  });

  it("photo + review filled, wears still open", () => {
    const slots = buildSlots({ hasPhoto: true, hasReview: true, axisDone: 0, axisTotal: 5 });
    expect(slots.filter((s) => s.filled).map((s) => s.key)).toEqual(["photo", "review"]);
    expect(slots.find((s) => s.key === "wears")!.filled).toBe(false);
  });

  it("everything given -> all base slots filled", () => {
    const slots = buildSlots({ hasPhoto: true, hasReview: true, axisDone: 5, axisTotal: 5 });
    expect(slots.every((s) => s.filled)).toBe(true);
  });

  it("carry + weight slots are absent until the wear table exists", () => {
    const slots = buildSlots({ hasPhoto: false, hasReview: false, axisDone: 0, axisTotal: 5 });
    expect(slots.some((s) => s.key === "carry" || s.key === "weight")).toBe(false);
  });

  it("wearAvailable adds carry + weight slots anchored to the wear section", () => {
    const slots = buildSlots({
      hasPhoto: false,
      hasReview: false,
      axisDone: 0,
      axisTotal: 5,
      wearAvailable: true,
    });
    expect(slots.map((s) => s.key)).toEqual(["photo", "review", "wears", "carry", "weight"]);
    const wearSlots = slots.filter((s) => s.key === "carry" || s.key === "weight");
    expect(wearSlots.every((s) => s.anchor === "#how-you-carry")).toBe(true);
    expect(wearSlots.every((s) => s.filled)).toBe(false);
  });

  it("carry/weight fill independently", () => {
    const slots = buildSlots({
      hasPhoto: false,
      hasReview: false,
      axisDone: 0,
      axisTotal: 5,
      wearAvailable: true,
      hasCarry: true,
      hasWeight: false,
    });
    expect(slots.find((s) => s.key === "carry")!.filled).toBe(true);
    expect(slots.find((s) => s.key === "weight")!.filled).toBe(false);
  });
});
