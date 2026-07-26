import { describe, it, expect } from "vitest";
import { parseMeasurements, consensus } from "../../../supabase/ingest/promote-spec-facts";

/**
 * The parser's whole job is to REFUSE ambiguity. ~46% of the measurement strings in
 * prod carry no unit, and coercing them would silently poison every derived size and
 * capacity scale. These tests pin the refusals as hard as the successes.
 */
describe("parseMeasurements", () => {
  it("converts stated inches to cm", () => {
    expect(parseMeasurements('9 x 5.5 x 3.5 in')).toEqual({ h: 22.9, w: 14, d: 8.9 });
  });

  it("keeps stated centimetres as-is", () => {
    expect(parseMeasurements("25 x 15 x 7 cm")).toEqual({ h: 25, w: 15, d: 7 });
  });

  it("reads a bare small triple as inches", () => {
    // Largest side under 30 with no unit: 9.8in is a common bag; 9.8cm is not.
    expect(parseMeasurements("9.8 x 6 x 3")).toEqual({ h: 24.9, w: 15.2, d: 7.6 });
  });

  it("reads a bare large triple as centimetres", () => {
    expect(parseMeasurements("32 x 24 x 12")).toEqual({ h: 32, w: 24, d: 12 });
  });

  it("refuses fewer than three numbers", () => {
    expect(parseMeasurements("25 x 15")).toBeNull();
    expect(parseMeasurements("one size")).toBeNull();
  });

  it("refuses absurd magnitudes rather than coercing them", () => {
    expect(parseMeasurements("900 x 400 x 200")).toBeNull();
  });

  it("refuses results outside a handbag envelope", () => {
    // 1 x 1 x 1 in = 2.5cm, below the 5cm floor.
    expect(parseMeasurements("1 x 1 x 1 in")).toBeNull();
  });

  it("handles null and empty input", () => {
    expect(parseMeasurements(null)).toBeNull();
    expect(parseMeasurements(undefined)).toBeNull();
    expect(parseMeasurements("")).toBeNull();
  });

  it("accepts inch marks as a unit signal", () => {
    expect(parseMeasurements('10" x 8" x 4"')).toEqual({ h: 25.4, w: 20.3, d: 10.2 });
  });

  // The failures below are the real myGemma strings that produced 285 bad rows on
  // 2026-07-26, all reverted. Depth is essentially always a handbag's smallest
  // dimension, and a big first number is usually a strap length leaking in.
  it("refuses a string whose depth is not the smallest dimension", () => {
    // Gucci Blondie Medium: source "5.5 x 8 x 32" wrote a 32cm depth on a 5.5cm bag.
    expect(parseMeasurements("5.5 x 8 x 32")).toBeNull();
  });

  it("refuses a strap length leaking into the first slot", () => {
    // Prada Symbole MINI: "25 x 7 x 3.2 in" made a mini bag 63.5cm tall.
    expect(parseMeasurements("25 x 7 x 3.2 in")).toBeNull();
    // Balenciaga Hourglass XS: same shape of error.
    expect(parseMeasurements("25 x 6.5 x 4 in")).toBeNull();
  });

  it("still accepts a genuinely large bag whose axes are all plausible", () => {
    // A big tote: tall AND wide, so nothing looks like a stray strap figure.
    expect(parseMeasurements("55 x 40 x 20 cm")).toEqual({ h: 55, w: 40, d: 20 });
  });
});

describe("consensus", () => {
  it("returns the majority winner when it clears the share threshold", () => {
    const v = new Map([["zip", 8], ["turnlock", 2]]);
    expect(consensus(v)).toEqual({ value: "zip", votes: 8, share: 0.8 });
  });

  it("refuses a genuine split rather than coin-flipping", () => {
    const v = new Map([["zip", 5], ["turnlock", 5]]);
    expect(consensus(v)).toBeNull();
  });

  it("refuses below the vote floor", () => {
    const v = new Map([["zip", 1]]);
    expect(consensus(v)).toBeNull();
  });

  it("accepts a unanimous pair at the floor", () => {
    const v = new Map([["flap", 2]]);
    expect(consensus(v)).toEqual({ value: "flap", votes: 2, share: 1 });
  });
});
