/**
 * Frame picking for the camera identify flow — the pure, testable half.
 *
 * Why this exists: a hand-shot thrift-store video is mostly motion blur. Reading
 * a fixed timestamp gives you whatever the pan was doing at that instant; the
 * useful frames are the few where the shopper paused on the bag, the stamp, or
 * the tag. We score every sampled frame for sharpness and keep the best few,
 * spread out in time so we don't send five near-duplicates of the same pause.
 *
 * The DOM side (seeking a <video>, drawing to canvas) lives in extract.ts;
 * everything here operates on plain arrays so it runs in vitest without a
 * browser.
 */

export interface ScoredFrame {
  /** Position of the frame in the source video, in seconds. */
  timeSec: number;
  /** Laplacian-variance sharpness score. Higher = crisper. */
  sharpness: number;
}

/**
 * Luma (rec. 601) grayscale from RGBA pixel data. Returns one byte per pixel.
 */
export function toGrayscale(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    out[j] = (rgba[i]! * 299 + rgba[i + 1]! * 587 + rgba[i + 2]! * 114) / 1000;
  }
  return out;
}

/**
 * Variance of the 4-neighbour Laplacian — the standard cheap blur detector.
 * A motion-blurred frame has soft edges everywhere, so its Laplacian responses
 * cluster near zero and the variance collapses; a crisp frame spikes it.
 * Interior pixels only (edges skipped), so w and h must be >= 3.
 */
export function laplacianVariance(
  gray: Uint8ClampedArray,
  w: number,
  h: number
): number {
  if (w < 3 || h < 3 || gray.length < w * h) return 0;
  let sum = 0;
  let sumSq = 0;
  const n = (w - 2) * (h - 2);
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const i = row + x;
      const lap =
        4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - w]! - gray[i + w]!;
      sum += lap;
      sumSq += lap * lap;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

/**
 * Picks up to `k` frames, sharpest first, enforcing a minimum time gap so the
 * selection spreads across the clip instead of clustering on one steady pause.
 *
 * Greedy by score: take the sharpest remaining frame whose distance to every
 * already-picked frame is >= minGapSec. If the gap rule leaves us short of k
 * (short clip, one long pause), relax it and fill with the sharpest leftovers —
 * a duplicate-ish sharp frame still beats a blurry distinct one.
 * Returns picks in chronological order.
 */
export function pickSpacedTop(
  frames: ScoredFrame[],
  k: number,
  minGapSec: number
): ScoredFrame[] {
  if (k <= 0 || frames.length === 0) return [];
  const byScore = [...frames].sort((a, b) => b.sharpness - a.sharpness);
  const picked: ScoredFrame[] = [];
  for (const f of byScore) {
    if (picked.length >= k) break;
    if (picked.every((p) => Math.abs(p.timeSec - f.timeSec) >= minGapSec)) {
      picked.push(f);
    }
  }
  if (picked.length < k) {
    for (const f of byScore) {
      if (picked.length >= k) break;
      if (!picked.includes(f)) picked.push(f);
    }
  }
  return picked.sort((a, b) => a.timeSec - b.timeSec);
}

/**
 * Evenly spaced sample timestamps across a clip, padded off the very ends
 * (first/last ~5% are usually the phone being raised or lowered).
 */
export function sampleTimestamps(durationSec: number, count: number): number[] {
  if (!Number.isFinite(durationSec) || durationSec <= 0 || count <= 0) return [];
  const start = durationSec * 0.05;
  const end = durationSec * 0.95;
  if (count === 1) return [(start + end) / 2];
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + i * step);
}
