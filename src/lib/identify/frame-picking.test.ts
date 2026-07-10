import { describe, expect, it } from "vitest";
import {
  laplacianVariance,
  pickSpacedTop,
  sampleTimestamps,
  toGrayscale,
  type ScoredFrame,
} from "./frame-picking";

function rgbaFromGray(gray: number[]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(gray.length * 4);
  gray.forEach((g, i) => {
    out[i * 4] = g;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = g;
    out[i * 4 + 3] = 255;
  });
  return out;
}

describe("toGrayscale", () => {
  it("maps pure channels by luma weights", () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
    const gray = toGrayscale(rgba);
    expect(gray[0]).toBe(76); // .299
    expect(gray[1]).toBe(150); // .587
    expect(gray[2]).toBe(29); // .114
  });

  it("keeps neutral gray unchanged", () => {
    const gray = toGrayscale(rgbaFromGray([128, 128, 128, 128]));
    expect(Array.from(gray)).toEqual([128, 128, 128, 128]);
  });
});

describe("laplacianVariance", () => {
  it("is zero on a flat image", () => {
    const flat = new Uint8ClampedArray(25).fill(100);
    expect(laplacianVariance(flat, 5, 5)).toBe(0);
  });

  it("scores a hard edge above a smooth ramp", () => {
    const w = 8;
    const h = 8;
    // Hard vertical edge: 0 | 255 halves.
    const edge = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) edge[y * w + x] = x < w / 2 ? 0 : 255;
    // Smooth ramp across the same range.
    const ramp = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) ramp[y * w + x] = Math.round((x / (w - 1)) * 255);
    expect(laplacianVariance(edge, w, h)).toBeGreaterThan(
      laplacianVariance(ramp, w, h) * 10
    );
  });

  it("returns 0 for degenerate sizes instead of NaN", () => {
    expect(laplacianVariance(new Uint8ClampedArray(4), 2, 2)).toBe(0);
  });
});

describe("pickSpacedTop", () => {
  const frames: ScoredFrame[] = [
    { timeSec: 0.5, sharpness: 90 },
    { timeSec: 0.7, sharpness: 100 }, // sharpest, close to 0.5
    { timeSec: 2.0, sharpness: 40 },
    { timeSec: 3.5, sharpness: 80 },
    { timeSec: 3.7, sharpness: 75 }, // close to 3.5
    { timeSec: 5.0, sharpness: 10 },
  ];

  it("takes the sharpest frames while enforcing the time gap", () => {
    const picks = pickSpacedTop(frames, 3, 1.0);
    // Greedy by sharpness: 0.7 (100) in; 0.5 (90) out on gap; 3.5 (80) in;
    // 3.7 (75) out on gap; 2.0 (40) in. The 5.0s frame (10) never gets a slot.
    expect(picks.map((f) => f.timeSec)).toEqual([0.7, 2.0, 3.5]);
  });

  it("returns picks in chronological order", () => {
    const picks = pickSpacedTop(frames, 2, 1.0);
    expect(picks[0]!.timeSec).toBeLessThan(picks[1]!.timeSec);
  });

  it("relaxes the gap rather than under-filling", () => {
    const clustered: ScoredFrame[] = [
      { timeSec: 1.0, sharpness: 100 },
      { timeSec: 1.1, sharpness: 90 },
      { timeSec: 1.2, sharpness: 80 },
    ];
    const picks = pickSpacedTop(clustered, 2, 5.0);
    expect(picks).toHaveLength(2);
    expect(picks.map((f) => f.sharpness).sort((a, b) => b - a)).toEqual([100, 90]);
  });

  it("handles empty input and k=0", () => {
    expect(pickSpacedTop([], 3, 1)).toEqual([]);
    expect(pickSpacedTop(frames, 0, 1)).toEqual([]);
  });
});

describe("sampleTimestamps", () => {
  it("spreads count samples inside the padded window", () => {
    const ts = sampleTimestamps(10, 5);
    expect(ts).toHaveLength(5);
    expect(ts[0]).toBeCloseTo(0.5);
    expect(ts[4]).toBeCloseTo(9.5);
    // strictly increasing
    for (let i = 1; i < ts.length; i++) expect(ts[i]!).toBeGreaterThan(ts[i - 1]!);
  });

  it("handles single sample and bad durations", () => {
    expect(sampleTimestamps(10, 1)).toEqual([5]);
    expect(sampleTimestamps(0, 4)).toEqual([]);
    expect(sampleTimestamps(NaN, 4)).toEqual([]);
  });
});
