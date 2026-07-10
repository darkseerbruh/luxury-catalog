"use client";

/**
 * Live camera capture with real-time feedback — the "QR scanner" model.
 *
 * Instead of instructing users how to film a bag, the viewfinder reacts while
 * they film: a steadiness chip flips to "Sharp" when the frame is crisp, a
 * counter fills as good frames are auto-collected, and the logo chip ticks the
 * moment a brand marking is actually read (a throttled, cheap server check).
 * Users self-correct without being lectured, the way a QR scanner teaches you
 * to hold still.
 *
 * Frames are collected automatically: whenever the feed is sharp and enough
 * time has passed since the last keep, the current frame is exported at upload
 * size. "Done" hands the best few to the parent, which runs the normal
 * identify call. If the camera can't start (denied, unsupported, desktop
 * without one), the parent falls back to the file picker path.
 */

import { useEffect, useRef, useState } from "react";
import { scoreFrame, UPLOAD_EDGE } from "@/lib/identify/extract";
import type { LiveReadResponse } from "@/lib/identify/types";

/** Export the video element's current frame as a JPEG capped at maxEdge. */
async function exportFrame(
  video: HTMLVideoElement,
  maxEdge: number
): Promise<Blob | null> {
  const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
  );
}

/** Frames auto-kept before we consider the capture complete. */
const TARGET_FRAMES = 4;
/** Max frames retained (best-by-sharpness wins beyond this). */
const MAX_KEPT = 6;
/** Min seconds between auto-kept frames, so the set spans the walkaround. */
const KEEP_GAP_MS = 1200;
/** Absolute sharpness floor below which a frame is never kept or pinged. */
const SHARP_FLOOR = 25;
/** Fraction of the session's best sharpness that counts as "sharp now". */
const SHARP_RATIO = 0.45;
/** Min interval between live-read pings. */
const PING_GAP_MS = 2500;
/** Give up pinging after this many attempts (the chip stays a hint). */
const MAX_PINGS = 12;

const HINTS = [
  "Show the whole bag",
  "Flip it around, sides too",
  "Now the logo or stamp, up close",
  "Zipper pull and hardware",
  "The label inside if you can",
];

interface KeptFrame {
  atMs: number;
  sharpness: number;
  blob: Blob;
}

export interface CameraCaptureResult {
  frames: Blob[];
  /** Brand text the live check read during filming, if any. */
  liveReadText: string | null;
}

export default function CameraCapture({
  onDone,
  onCancel,
  onUnavailable,
}: {
  onDone: (result: CameraCaptureResult) => void;
  onCancel: () => void;
  /** Called when the camera cannot start; parent should offer the file picker. */
  onUnavailable: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keptRef = useRef<KeptFrame[]>([]);
  const bestScoreRef = useRef(0);
  const lastKeepAtRef = useRef(0);
  const lastPingAtRef = useRef(0);
  const pingCountRef = useRef(0);
  const pingInFlightRef = useRef(false);
  const readTextRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);
  const lastScoreAtRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [isSharp, setIsSharp] = useState(false);
  const [keptCount, setKeptCount] = useState(0);
  const [readText, setReadText] = useState<string | null>(null);
  const [hintIndex, setHintIndex] = useState(0);

  // Rotate the capture hints; stop rotating past the logo hint once it's read.
  useEffect(() => {
    const id = setInterval(() => {
      setHintIndex((i) => (i + 1) % HINTS.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Camera lifecycle + the per-frame loop (score sharpness ~4x/s, auto-keep
  // sharp spaced frames, ping the live logo read). The loop lives inside the
  // effect so it can reference itself without render-time gymnastics.
  useEffect(() => {
    let cancelled = false;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;
      const now = performance.now();
      if (now - lastScoreAtRef.current < 250) return;
      lastScoreAtRef.current = now;

      const score = scoreFrame(video, video.videoWidth, video.videoHeight);
      bestScoreRef.current = Math.max(bestScoreRef.current, score);
      const sharp =
        score >= SHARP_FLOOR && score >= bestScoreRef.current * SHARP_RATIO;
      setIsSharp(sharp);
      if (!sharp) return;

      // Auto-keep a sharp, time-spaced frame.
      if (now - lastKeepAtRef.current >= KEEP_GAP_MS) {
        lastKeepAtRef.current = now;
        void exportFrame(video, UPLOAD_EDGE).then((blob) => {
          if (!blob) return;
          const kept = keptRef.current;
          kept.push({ atMs: now, sharpness: score, blob });
          if (kept.length > MAX_KEPT) {
            kept.sort((a, b) => b.sharpness - a.sharpness);
            kept.length = MAX_KEPT;
          }
          setKeptCount(Math.min(kept.length, TARGET_FRAMES));
        });
      }

      // Live logo read: throttled, stops on first success or after MAX_PINGS.
      if (
        readTextRef.current === null &&
        !pingInFlightRef.current &&
        pingCountRef.current < MAX_PINGS &&
        now - lastPingAtRef.current >= PING_GAP_MS
      ) {
        lastPingAtRef.current = now;
        pingCountRef.current += 1;
        pingInFlightRef.current = true;
        void exportFrame(video, 1024)
          .then(async (blob) => {
            if (!blob) return;
            const body = new FormData();
            body.append("frame", blob, "frame.jpg");
            const res = await fetch("/api/identify/live-read", { method: "POST", body });
            if (!res.ok) return;
            const data = (await res.json()) as LiveReadResponse;
            if (data.readable && data.text) {
              readTextRef.current = data.text;
              setReadText(data.text);
              // The frame that read the logo is worth keeping at full size.
              void exportFrame(video, UPLOAD_EDGE).then((full) => {
                if (full)
                  keptRef.current.push({ atMs: now, sharpness: 1e9, blob: full });
              });
            }
          })
          .catch(() => {
            // Network hiccup: the chip simply stays a hint.
          })
          .finally(() => {
            pingInFlightRef.current = false;
          });
      }
    };

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onUnavailable("Live camera is not available in this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setReady(true);
          rafRef.current = requestAnimationFrame(loop);
        }
      } catch {
        onUnavailable(
          "Could not start the camera. You can upload a photo or video instead."
        );
      }
    }
    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const frames = [...keptRef.current]
      .sort((a, b) => b.sharpness - a.sharpness)
      .slice(0, TARGET_FRAMES)
      .sort((a, b) => a.atMs - b.atMs)
      .map((f) => f.blob);
    onDone({ frames, liveReadText: readTextRef.current });
  }

  const captureComplete = keptCount >= TARGET_FRAMES && readText !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-[3/4] w-full object-cover"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            Starting the camera…
          </div>
        )}

        {/* Live feedback chips */}
        {ready && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-center text-sm text-white/90">
              {captureComplete ? "Got what we need. Tap done." : HINTS[hintIndex]}
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span
                className={`rounded-full border px-3 py-1 ${
                  isSharp
                    ? "border-gold/70 bg-gold/20 text-gold"
                    : "border-white/30 bg-black/40 text-white/80"
                }`}
              >
                {isSharp ? "Sharp" : "Hold steady"}
              </span>
              <span className="rounded-full border border-white/30 bg-black/40 px-3 py-1 text-white/80">
                Frames {keptCount}/{TARGET_FRAMES}
              </span>
              <span
                className={`rounded-full border px-3 py-1 ${
                  readText
                    ? "border-gold/70 bg-gold/20 text-gold"
                    : "border-white/30 bg-black/40 text-white/80"
                }`}
              >
                {readText ? `Read: ${readText}` : "Logo not read yet"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            cancelAnimationFrame(rafRef.current);
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onCancel();
          }}
          className="rounded-full border border-border px-5 py-3 text-sm text-muted transition-colors hover:border-gold hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={finish}
          disabled={keptCount === 0}
          className="flex-1 rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {captureComplete ? "Done, check this bag" : "Use what I have"}
        </button>
      </div>
      <p className="text-center text-xs text-muted">
        Film like you would show a friend: the whole bag, then linger a beat on
        the stamp or label. The chips tick when we have what we need.
      </p>
    </div>
  );
}
