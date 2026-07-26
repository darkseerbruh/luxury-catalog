import { describe, it, expect } from "vitest";
import {
  mapLabel,
  parseMeasure,
  parseLabelledDimensions,
  agreeDimension,
} from "../ingest/labelled-dimensions";

describe("mapLabel — the cross-source trap", () => {
  it('maps Fashionphile "Width" to DEPTH, not width', () => {
    // The whole reason this module exists. Verified on a Speedy 25 against LV's
    // published spec: FP's Width is the front-to-back measurement.
    expect(mapLabel("fashionphile", "Width")?.axis).toBe("depth");
  });

  it('maps Fashionphile "Base length" to WIDTH', () => {
    expect(mapLabel("fashionphile", "Base length")?.axis).toBe("width");
    expect(mapLabel("fashionphile", "Length")?.axis).toBe("width");
  });

  it('maps TheRealReal "Width" to WIDTH and "Depth" to DEPTH', () => {
    // Same word, opposite meaning to Fashionphile. Hence per-source mapping.
    expect(mapLabel("therealreal", "Width")?.axis).toBe("width");
    expect(mapLabel("therealreal", "Depth")?.axis).toBe("depth");
  });

  it("records the measurement convention per source", () => {
    // FP measures at the base; conflating that with an overall span cost 2.7cm on a
    // Classic Flap Small in the archivist pull.
    expect(mapLabel("fashionphile", "Base length")?.convention).toBe("base");
    expect(mapLabel("therealreal", "Width")?.convention).toBe("overall");
  });

  it("drops labels it does not understand rather than guessing an axis", () => {
    expect(mapLabel("fashionphile", "Interior pocket")).toBeNull();
    expect(mapLabel("therealreal", "Colour")).toBeNull();
  });
});

describe("parseMeasure", () => {
  it("reads inches and centimetres", () => {
    expect(parseMeasure("10 in")).toEqual({ value: 10, unit: "in" });
    expect(parseMeasure('8.25"')).toEqual({ value: 8.25, unit: "in" });
    expect(parseMeasure("26 cm")).toEqual({ value: 26, unit: "cm" });
  });

  it("refuses a bare number, because an unstated unit is how the last attempt broke", () => {
    expect(parseMeasure("10")).toBeNull();
  });
});

describe("parseLabelledDimensions", () => {
  it("parses a real Fashionphile row set with the correct axis mapping", () => {
    const d = parseLabelledDimensions("fashionphile", [
      { label: "Base length", value: "10 in" },
      { label: "Height", value: "8 in" },
      { label: "Width", value: "6 in" },
      { label: "Drop", value: "3.5 in" },
    ]);
    expect(d).not.toBeNull();
    expect(d!.widthCm).toBe(25.4);   // from Base length
    expect(d!.heightCm).toBe(20.3);
    expect(d!.depthCm).toBe(15.2);   // from FP "Width"
    expect(d!.strapDropCm).toBe(8.9);
    expect(d!.convention).toBe("base");
  });

  it("survives Fashionphile shuffling its row order", () => {
    // 2 of 30 probed pages came back in a different order, so nothing may be positional.
    const d = parseLabelledDimensions("fashionphile", [
      { label: "Base length", value: "10 in" },
      { label: "Width", value: "6 in" },
      { label: "Drop", value: "3.5 in" },
      { label: "Height", value: "8 in" },
    ]);
    expect(d!.heightCm).toBe(20.3);
    expect(d!.depthCm).toBe(15.2);
  });

  it("keeps the smaller of two identically labelled Drop rows", () => {
    // FP ships handle drop and shoulder drop both labelled "Drop" on 13 of 30 pages.
    // Averaging them would invent a measurement that describes neither.
    const d = parseLabelledDimensions("fashionphile", [
      { label: "Base length", value: "10 in" },
      { label: "Height", value: "8 in" },
      { label: "Drop", value: "4 in" },
      { label: "Drop", value: "21 in" },
    ]);
    expect(d!.strapDropCm).toBe(10.2);
  });

  it("returns null when height or width is missing", () => {
    const d = parseLabelledDimensions("fashionphile", [{ label: "Width", value: "6 in" }]);
    expect(d).toBeNull();
  });

  it("skips an out-of-range value instead of storing it", () => {
    const d = parseLabelledDimensions("therealreal", [
      { label: "Width", value: "30 cm" },
      { label: "Height", value: "20 cm" },
      { label: "Depth", value: "400 cm" },
    ]);
    expect(d!.depthCm).toBeNull();
  });
});

describe("agreeDimension", () => {
  it("needs corroboration before writing anything", () => {
    expect(agreeDimension([25.4])).toBeNull();
  });

  it("takes the median of listings that agree", () => {
    expect(agreeDimension([25.4, 25.0, 25.6])).toBe(25.4);
  });

  it("rejects a source-side typo rather than averaging it in", () => {
    // TheRealReal really does publish Depth 0.25in on a bucket bag.
    expect(agreeDimension([15.2, 15.0, 0.6])).toBe(15.1);
  });

  it("refuses when the spread is too wide to call", () => {
    // The probe found the same Speedy 30 at 8.25in and 10.75in, one slumped and one
    // stood up. Two listings that far apart are not a measurement.
    expect(agreeDimension([21.0, 27.3])).toBeNull();
  });
});
