"use client";

/**
 * Spot the Fake — the camera identify flow.
 *
 * Three ways in, one engine:
 * - Live camera: viewfinder with real-time feedback chips (sharpness, frames
 *   collected, "logo read"). The QR-scanner model: the UI teaches by reacting,
 *   not instructing.
 * - Snap or upload: photos and VIDEOS, several at once. Each video is treated
 *   as its own bag (the haul case: film thirteen bags, get thirteen reads);
 *   photos in one selection are treated as angles of one bag.
 * - No camera at all: the by-house marker guides remain one tap away.
 *
 * Videos never upload raw. Frames are sampled in-browser, scored for
 * sharpness, and only the best few go up. When the first pass spots a stamp,
 * label, or tag it could not read, the client re-crops that region at native
 * resolution and asks once more (the logo pass) — that second look is what
 * turns "navy crossbody, brand unknown" into a named bag.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track, EVENTS } from "@/lib/analytics/events";
import {
  cropHintRegion,
  cropImageHintRegion,
  extractSharpFrames,
  imageFileToUploadJpeg,
} from "@/lib/identify/extract";
import type { IdentifyResponse, LogoHint } from "@/lib/identify/types";
import CameraCapture, {
  type CameraCaptureResult,
} from "@/components/identify/CameraCapture";
import ScanResult from "@/components/identify/ScanResult";

type ItemStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "waiting"
  | "refining"
  | "done"
  | "error";

interface ScanItem {
  id: number;
  label: string;
  kind: "photo" | "video" | "live";
  status: ItemStatus;
  /** 0..1 while extracting frames from a video. */
  progress: number;
  result: IdentifyResponse | null;
  liveReadText: string | null;
  error: string | null;
}

const STATUS_LINE: Record<ItemStatus, string> = {
  queued: "Waiting its turn",
  extracting: "Picking the sharpest frames",
  analyzing: "Checking the markers",
  waiting: "Lots of scans right now. Holding your spot, back in a moment",
  refining: "Taking a closer look at the stamp",
  done: "",
  error: "",
};

/** Max photos sent as angles of one bag. */
const MAX_PHOTOS_PER_BAG = 4;
/** Hints worth a native-res second look, most promising kinds first. */
const REFINE_KIND_ORDER: LogoHint["kind"][] = [
  "stamp",
  "label",
  "medallion",
  "tag",
  "print",
  "hardware",
];

function pickRefineHints(hints: LogoHint[]): LogoHint[] {
  return hints
    .filter((h) => !h.legible)
    .sort(
      (a, b) =>
        REFINE_KIND_ORDER.indexOf(a.kind) - REFINE_KIND_ORDER.indexOf(b.kind)
    )
    .slice(0, 3);
}

/** A first pass that leaves the brand unread or shaky earns the second look. */
function needsRefine(res: IdentifyResponse): boolean {
  if (!res.identification) return false;
  const unreadHints = (res.logoHints ?? []).some((h) => !h.legible);
  return unreadHints && (!res.identification.brand || res.identification.confidence !== "high");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** How many times a 429'd call waits out its window and retries before giving up. */
const RATE_LIMIT_MAX_RETRIES = 2;
/** Cap a single wait so a stuck window can never hang a bag indefinitely. */
const RATE_LIMIT_MAX_WAIT_MS = 210_000;
/** Fallback pause when a 429 arrives without a usable Retry-After. */
const RATE_LIMIT_FALLBACK_WAIT_MS = 5_000;

/**
 * Posts to the identify API and, when the shared rate limit is hit (429), waits
 * out the server's Retry-After and resumes rather than failing the bag. A big
 * haul serializes its calls, so on a warm instance it can trip the limit
 * mid-queue; without this, every later bag dead-ended on "Too many requests."
 * onRateLimited lets the caller show a "holding your spot" status while paused.
 */
async function postIdentify(
  blobs: Blob[],
  prior?: IdentifyResponse["identification"],
  onRateLimited?: (retryAfterSeconds: number) => void
): Promise<IdentifyResponse> {
  const body = new FormData();
  blobs.forEach((b, i) => body.append("images", b, `frame-${i}.jpg`));
  if (prior) body.append("prior", JSON.stringify(prior));

  for (let attempt = 0; ; attempt++) {
    const res = await fetch("/api/identify", { method: "POST", body });
    if (res.status !== 429 || attempt >= RATE_LIMIT_MAX_RETRIES) {
      // Success, a non-rate-limit error, or we are out of retries: return the
      // body as-is (a final 429 falls back to its { error } payload).
      return (await res.json()) as IdentifyResponse;
    }
    const retryAfter = Number(res.headers.get("Retry-After"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, RATE_LIMIT_MAX_WAIT_MS)
        : RATE_LIMIT_FALLBACK_WAIT_MS;
    onRateLimited?.(Math.ceil(waitMs / 1000));
    await sleep(waitMs);
  }
}

export default function IdentifyPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(1);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraNote, setCameraNote] = useState<string | null>(null);
  const busy = items.some((i) =>
    ["queued", "extracting", "analyzing", "waiting", "refining"].includes(i.status)
  );

  const patchItem = useCallback((id: number, patch: Partial<ScanItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  // Timestamps of the frames each video item uploaded, so the logo pass can
  // re-seek the same frame in the source video. Keyed by item id.
  const blobsMetaRef = useRef<Record<number, number[]>>({});

  function hintTime(hint: LogoHint, times: number[] | undefined): number {
    if (!times || times.length === 0) return 0;
    return times[Math.min(hint.imageIndex, times.length - 1)]!;
  }

  /** Photo-set and live-capture path (video goes through runFromPicked). */
  const runItem = useCallback(
    async (item: ScanItem, source: { imageFiles?: File[]; frames?: Blob[] }) => {
      try {
        // 1. Gather upload frames.
        let blobs: Blob[];
        if (source.imageFiles) {
          patchItem(item.id, { status: "extracting" });
          blobs = await Promise.all(
            source.imageFiles.slice(0, MAX_PHOTOS_PER_BAG).map(imageFileToUploadJpeg)
          );
        } else {
          blobs = source.frames ?? [];
        }
        if (blobs.length === 0) throw new Error("No usable frames in this one.");

        // 2. First pass.
        patchItem(item.id, { status: "analyzing" });
        let result = await postIdentify(blobs, undefined, () =>
          patchItem(item.id, { status: "waiting" })
        );
        if (result.error) throw new Error(result.error);
        let refined = false;

        // 3. The logo pass: re-crop unread stamp/label regions at native
        // resolution and ask once more. Needs the original photos to re-crop
        // from (live-capture frames are already the best we hold).
        if (needsRefine(result) && source.imageFiles) {
          const hints = pickRefineHints(result.logoHints ?? []);
          if (hints.length > 0) {
            patchItem(item.id, { status: "refining" });
            try {
              const crops: Blob[] = [];
              for (const hint of hints) {
                const file =
                  source.imageFiles[Math.min(hint.imageIndex, source.imageFiles.length - 1)]!;
                crops.push(await cropImageHintRegion(file, hint));
              }
              if (crops.length > 0 && result.identification) {
                const second = await postIdentify(
                  crops,
                  result.identification,
                  () => patchItem(item.id, { status: "waiting" })
                );
                if (!second.error && second.identification) {
                  result = second;
                  refined = true;
                }
              }
            } catch {
              // Refine is best-effort: the first-pass result stands.
            }
          }
        }

        patchItem(item.id, { status: "done", result });
        track(EVENTS.identifyScanCompleted, {
          kind: item.kind,
          matched: Boolean(result.catalogMatch?.styleId),
          confidence: result.identification?.confidence,
          brand: result.identification?.brand ?? undefined,
          refined,
        });
      } catch (err) {
        patchItem(item.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Something went wrong. Try again.",
        });
      }
    },
    [patchItem]
  );

  // Resolves when the given item reaches a terminal state. Polling a ref keeps
  // this independent of render timing without threading promises through state.
  const itemsRef = useRef<ScanItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const waitForItem = useCallback((id: number): Promise<void> => {
    return new Promise((resolve) => {
      const check = () => {
        const it = itemsRef.current.find((i) => i.id === id);
        if (!it || it.status === "done" || it.status === "error") resolve();
        else setTimeout(check, 250);
      };
      check();
    });
  }, []);

  // Video path where frames were already extracted (so timestamps are known).
  const runFromPicked = useCallback(
    async (item: ScanItem, videoFile: File, blobs: Blob[]) => {
      try {
        if (blobs.length === 0) throw new Error("No usable frames in this one.");
        patchItem(item.id, { status: "analyzing" });
        let result = await postIdentify(blobs, undefined, () =>
          patchItem(item.id, { status: "waiting" })
        );
        if (result.error) throw new Error(result.error);
        let refined = false;

        if (needsRefine(result)) {
          const hints = pickRefineHints(result.logoHints ?? []);
          if (hints.length > 0) {
            patchItem(item.id, { status: "refining" });
            try {
              const times = blobsMetaRef.current[item.id];
              const crops: Blob[] = [];
              for (const hint of hints) {
                crops.push(await cropHintRegion(videoFile, hintTime(hint, times), hint));
              }
              if (crops.length > 0 && result.identification) {
                const second = await postIdentify(
                  crops,
                  result.identification,
                  () => patchItem(item.id, { status: "waiting" })
                );
                if (!second.error && second.identification) {
                  result = second;
                  refined = true;
                }
              }
            } catch {
              // Refine is best-effort: the first-pass result stands.
            }
          }
        }

        patchItem(item.id, { status: "done", result });
        track(EVENTS.identifyScanCompleted, {
          kind: "video",
          matched: Boolean(result.catalogMatch?.styleId),
          confidence: result.identification?.confidence,
          brand: result.identification?.brand ?? undefined,
          refined,
        });
      } catch (err) {
        patchItem(item.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Something went wrong. Try again.",
        });
      }
    },
    [patchItem]
  );

  const enqueueFiles = useCallback(
    (files: File[]) => {
      const videos = files.filter((f) => f.type.startsWith("video/"));
      const images = files.filter((f) => f.type.startsWith("image/"));
      const newItems: { item: ScanItem; run: () => void }[] = [];

      for (const video of videos) {
        const id = nextIdRef.current++;
        const item: ScanItem = {
          id,
          label: video.name.replace(/\.[^.]+$/, ""),
          kind: "video",
          status: "queued",
          progress: 0,
          result: null,
          liveReadText: null,
          error: null,
        };
        newItems.push({
          item,
          run: () =>
            void (async () => {
              // Capture the picked timestamps for the refine re-seek.
              const picked = await extractSharpFrames(video, {
                onProgress: (f) => patchItem(id, { progress: f, status: "extracting" }),
              });
              blobsMetaRef.current[id] = picked.map((p) => p.timeSec);
              await runFromPicked(item, video, picked.map((p) => p.blob));
            })(),
        });
      }
      if (images.length > 0) {
        const id = nextIdRef.current++;
        const item: ScanItem = {
          id,
          label: images.length > 1 ? `${images.length} photos, one bag` : images[0]!.name.replace(/\.[^.]+$/, ""),
          kind: "photo",
          status: "queued",
          progress: 0,
          result: null,
          liveReadText: null,
          error: null,
        };
        newItems.push({ item, run: () => void runItem(item, { imageFiles: images }) });
      }
      if (newItems.length === 0) return;

      setItems((prev) => [...prev, ...newItems.map((n) => n.item)]);
      track(EVENTS.identifyScanStarted, {
        kind: videos.length > 1 ? "haul" : videos.length === 1 ? "video" : "photo",
        count: newItems.length,
      });
      // Run sequentially so a haul doesn't fire five vision calls at once
      // (kinder to the rate limit and to the phone's memory).
      void (async () => {
        for (const n of newItems) {
          await Promise.resolve(n.run());
          await waitForItem(n.item.id);
        }
      })();
    },
    [patchItem, runItem, runFromPicked, waitForItem]
  );

  function handleCameraDone(capture: CameraCaptureResult) {
    setCameraOpen(false);
    if (capture.frames.length === 0) return;
    const id = nextIdRef.current++;
    const item: ScanItem = {
      id,
      label: "Live capture",
      kind: "live",
      status: "queued",
      progress: 0,
      result: null,
      liveReadText: capture.liveReadText,
      error: null,
    };
    setItems((prev) => [...prev, item]);
    track(EVENTS.identifyScanStarted, { kind: "live", count: 1 });
    void runItem(item, { frames: capture.frames });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) enqueueFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  function reset() {
    setItems([]);
    blobsMetaRef.current = {};
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-10">
      <header>
        <h1 className="font-serif text-3xl text-foreground">Spot the Fake</h1>
        <p className="mt-1 text-lg text-gold-soft">Is it real? Let&rsquo;s check the markers.</p>
        <p className="mt-2 text-muted">
          Found a bag in the wild? Point your camera at it, or film the whole
          haul and load it here. We&rsquo;ll tell you what each one looks like,
          what it would be worth if genuine, and how to check it&rsquo;s real.
          We flag what we can see and hedge what we can&rsquo;t. These are
          markers to check, not a verdict.
        </p>
      </header>

      {cameraOpen ? (
        <CameraCapture
          onDone={handleCameraDone}
          onCancel={() => setCameraOpen(false)}
          onUnavailable={(message) => {
            setCameraOpen(false);
            setCameraNote(message);
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setCameraNote(null);
              setCameraOpen(true);
            }}
            className="flex items-center justify-center gap-3 rounded-2xl bg-gold px-5 py-4 font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            <CameraIcon dark />
            Point the camera at it
          </button>
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface p-6 text-center transition-colors hover:border-gold/60"
          >
            <p className="text-foreground">Or upload photos and videos</p>
            <p className="text-sm text-muted">
              Several at once is fine. Each video reads as its own bag, so a
              filmed haul comes back as a list. JPEG, PNG, WebP, MOV, MP4.
            </p>
          </div>
          {cameraNote && (
            <p className="text-center text-sm text-muted">{cameraNote}</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {/* The photo path has real failure modes (rate limit, bad thrift-store
              light, low confidence). Always offer the no-photo route so the
              in-hand moment never dead-ends. */}
          <p className="text-center text-sm text-muted">
            No photo, or in a hurry?{" "}
            <Link href="/authentication" className="text-gold hover:underline">
              Check the markers by house →
            </Link>
          </p>
        </div>
      )}

      {/* Thrift-find logging CTA */}
      {(() => {
        const firstDone = items.find((i) => i.status === "done" && i.result?.identification);
        const idResult = firstDone?.result?.identification;
        return (
          <Link
            href={
              idResult?.brand || idResult?.style
                ? `/found?brand=${encodeURIComponent(idResult.brand ?? "")}&style=${encodeURIComponent(idResult.style ?? "")}`
                : "/found"
            }
            className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-4 text-center text-sm text-muted transition-colors hover:border-gold/50 hover:text-foreground"
          >
            Already snagged it? <span className="text-gold">Log your find →</span>
          </Link>
        );
      })()}

      {/* The queue: one card per bag. */}
      {items.map((item, idx) => (
        <div key={item.id} className="flex flex-col gap-3">
          {items.length > 1 && (
            <h2 className="border-b border-border pb-2 font-serif text-xl text-foreground">
              Bag {idx + 1}
              <span className="ml-2 text-sm font-normal text-muted">{item.label}</span>
            </h2>
          )}

          {item.status !== "done" && item.status !== "error" && (
            <div className="rounded-2xl border border-border bg-surface/50 p-5">
              <p className="text-sm text-foreground">{STATUS_LINE[item.status]}…</p>
              {item.status === "extracting" && item.kind === "video" && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${Math.round(item.progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {item.status === "error" && (
            <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
              {item.error}
            </div>
          )}

          {item.status === "done" && item.result && (
            <ScanResult result={item.result} liveReadText={item.liveReadText} />
          )}
        </div>
      ))}

      {items.length > 0 && !busy && (
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-border px-5 py-3 text-sm text-muted transition-colors hover:border-gold hover:text-foreground"
        >
          Start over
        </button>
      )}
    </main>
  );
}

function CameraIcon({ dark = false }: { dark?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={dark ? "text-bg" : "text-muted"}
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
