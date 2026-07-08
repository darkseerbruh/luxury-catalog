import { describe, it, expect } from "vitest";
import {
  CARRY_OPTIONS,
  WEIGHT_OPTIONS,
  isCarry,
  isWeightFeel,
  carryLabel,
  weightLabel,
} from "@/lib/wear-options";

describe("wear-options", () => {
  it("carry vocabulary matches the 0046 CHECK set", () => {
    expect(CARRY_OPTIONS.map((o) => o.value)).toEqual(["hand", "shoulder", "crossbody"]);
  });

  it("weight vocabulary matches the 0046 CHECK set", () => {
    expect(WEIGHT_OPTIONS.map((o) => o.value)).toEqual(["light", "just_right", "heavy"]);
  });

  it("guards accept only canonical values", () => {
    expect(isCarry("crossbody")).toBe(true);
    expect(isCarry("backpack")).toBe(false);
    expect(isWeightFeel("just_right")).toBe(true);
    expect(isWeightFeel("featherlight")).toBe(false);
  });

  it("labels resolve, and fall back to the raw value", () => {
    expect(carryLabel("crossbody")).toBe("Crossbody");
    expect(weightLabel("light")).toBe("Light");
    expect(carryLabel("mystery")).toBe("mystery");
  });
});
