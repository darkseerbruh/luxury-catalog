/**
 * Browser-side frame extraction for the camera identify flow.
 *
 * Everything here needs DOM APIs (<video>, canvas), so it must only be imported
 * from client components. The pure scoring/selection logic lives in
 * frame-picking.ts so it stays unit-testable.
 *
 * Design constraints this encodes:
 * - iPhone thrift videos are 4K HEVC; we NEVER upload the raw file. Frames are
 *   sampled in-browser, scored for sharpness, and only the best few leave the
 *   device as JPEGs capped at UPLOAD_EDGE px (matches the vision model's input
 *   ceiling, so a bigger upload buys nothing).
 * - The logo pass needs native resolution. Rather than holding 4K canvases in
 *   memory (or uploading them), we remember each picked frame's timestamp and
 *   re-seek the source video on demand to crop a region at full size.
 */
import {
  laplacianVariance,
  pickSpacedTop,
  sampleTimestamps,
  toGrayscale,
  type ScoredFrame,
} from "./frame-picking";
import type { LogoHint } from "./types";

/** Long-edge cap for frames sent to the identify API. */
export const UPLOAD_EDGE = 1568;
/** Long-edge cap for refine crops (they're small regions, keep them light). */
const CROP_EDGE = 1200;
/** Downscale width used only for sharpness scoring (cheap, perception-scale). */
const SCORE_WIDTH = 320;

export interface PickedFrame {
  timeSec: number;
  sharpness: number;
  /** JPEG capped at UPLOAD_EDGE, ready to send. */
  blob: Blob;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      quality
    );
  });
}

function drawScaled(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  maxEdge: number
): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(srcW * scale));
  canvas.height = Math.max(1, Math.round(srcH * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Sharpness score of the current content of a video element / canvas source. */
export function scoreFrame(
  source: CanvasImageSource,
  srcW: number,
  srcH: number
): number {
  const canvas = drawScaled(source, srcW, srcH, SCORE_WIDTH);
  const ctx = canvas.getContext("2d")!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return laplacianVariance(toGrayscale(data), canvas.width, canvas.height);
}

/**
 * Opens a video File off-DOM and resolves once metadata (duration, dimensions)
 * is known. Caller must call `release()` when done.
 */
async function openVideo(file: File): Promise<{
  video: HTMLVideoElement;
  release: () => void;
}> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not open this video."));
  });
  return { video, release: () => URL.revokeObjectURL(url) };
}

function seekTo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.onerror = () => reject(new Error("Seek failed."));
    video.currentTime = timeSec;
  });
}

/**
 * Samples `sampleCount` frames across the clip, scores each for sharpness, and
 * returns the best `pickCount` (time-spaced) as upload-ready JPEGs.
 * `onProgress` reports 0..1 for a progress bar.
 */
export async function extractSharpFrames(
  file: File,
  {
    sampleCount = 16,
    pickCount = 4,
    onProgress,
  }: {
    sampleCount?: number;
    pickCount?: number;
    onProgress?: (fraction: number) => void;
  } = {}
): Promise<PickedFrame[]> {
  const { video, release } = await openVideo(file);
  try {
    const duration = video.duration;
    const times = sampleTimestamps(duration, sampleCount);
    if (times.length === 0) throw new Error("This video looks empty.");

    // Pass 1: score every sampled timestamp (cheap, small canvas).
    const scored: ScoredFrame[] = [];
    for (let i = 0; i < times.length; i++) {
      await seekTo(video, times[i]!);
      scored.push({
        timeSec: times[i]!,
        sharpness: scoreFrame(video, video.videoWidth, video.videoHeight),
      });
      onProgress?.((i + 1) / (times.length + pickCount));
    }

    // Spacing: aim for picks spread across the clip, min gap = duration/(2k).
    const minGap = duration / (pickCount * 2);
    const picks = pickSpacedTop(scored, pickCount, minGap);

    // Pass 2: re-seek the winners and export upload-sized JPEGs.
    const out: PickedFrame[] = [];
    for (let i = 0; i < picks.length; i++) {
      await seekTo(video, picks[i]!.timeSec);
      const canvas = drawScaled(
        video,
        video.videoWidth,
        video.videoHeight,
        UPLOAD_EDGE
      );
      out.push({
        timeSec: picks[i]!.timeSec,
        sharpness: picks[i]!.sharpness,
        blob: await canvasToJpeg(canvas),
      });
      onProgress?.((times.length + i + 1) / (times.length + picks.length));
    }
    return out;
  } finally {
    release();
  }
}

/**
 * Native-resolution crop for the logo pass: re-seeks the source video to the
 * frame a LogoHint came from and crops the hinted region at full pixel size
 * (padded 15% each side so a slightly-off box still contains the stamp).
 */
export async function cropHintRegion(
  file: File,
  timeSec: number,
  hint: LogoHint
): Promise<Blob> {
  const { video, release } = await openVideo(file);
  try {
    await seekTo(video, timeSec);
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const pad = 0.15;
    const x = Math.max(0, (hint.region.x - hint.region.w * pad) * vw);
    const y = Math.max(0, (hint.region.y - hint.region.h * pad) * vh);
    const w = Math.min(vw - x, hint.region.w * (1 + 2 * pad) * vw);
    const h = Math.min(vh - y, hint.region.h * (1 + 2 * pad) * vh);
    if (w < 8 || h < 8) throw new Error("Hinted region is too small to crop.");

    const scale = Math.min(1, CROP_EDGE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, x, y, w, h, 0, 0, canvas.width, canvas.height);
    return canvasToJpeg(canvas, 0.9);
  } finally {
    release();
  }
}

/**
 * Native-resolution crop of a hinted region from a still image File — the
 * photo-upload counterpart of cropHintRegion. Same 15% padding rule.
 */
export async function cropImageHintRegion(file: File, hint: LogoHint): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const vw = bitmap.width;
    const vh = bitmap.height;
    const pad = 0.15;
    const x = Math.max(0, (hint.region.x - hint.region.w * pad) * vw);
    const y = Math.max(0, (hint.region.y - hint.region.h * pad) * vh);
    const w = Math.min(vw - x, hint.region.w * (1 + 2 * pad) * vw);
    const h = Math.min(vh - y, hint.region.h * (1 + 2 * pad) * vh);
    if (w < 8 || h < 8) throw new Error("Hinted region is too small to crop.");
    const scale = Math.min(1, CROP_EDGE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext("2d")!.drawImage(bitmap, x, y, w, h, 0, 0, canvas.width, canvas.height);
    return canvasToJpeg(canvas, 0.9);
  } finally {
    bitmap.close();
  }
}

/**
 * Downscales an image File for upload (photos straight from the picker can be
 * 12MP+; the vision ceiling is UPLOAD_EDGE anyway).
 */
export async function imageFileToUploadJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    if (
      Math.max(bitmap.width, bitmap.height) <= UPLOAD_EDGE &&
      file.type === "image/jpeg"
    ) {
      return file;
    }
    const canvas = drawScaled(bitmap, bitmap.width, bitmap.height, UPLOAD_EDGE);
    return await canvasToJpeg(canvas);
  } finally {
    bitmap.close();
  }
}
