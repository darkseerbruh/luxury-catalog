// Text-card montage: ONE short clip held the whole time, the whole hook shown as
// a single static caption block (wraps onto one screen, fixed size). This matches
// the TikTok text-hook format (one looping clip + a block of text + trending sound).
//
//   node scripts/montage-card.mjs examples/<name>.json
//
// Spec shape:
// { "name": "aff", "clip": "/abs/clip.mov", "start": 1.0, "duration": 6,
//   "caption": "Full hook text here.", "fontPx": 46, "zoom": 0.03 }
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OUTPUT_DIR, PUBLIC_DIR, TEMP_DIR } from "../config.mjs";

const specPath = process.argv[2];
if (!specPath) { console.error("Usage: node scripts/montage-card.mjs <spec.json>"); process.exit(1); }
const spec = JSON.parse(readFileSync(path.resolve(specPath), "utf8"));
const { name, clip, caption } = spec;
const start = spec.start ?? 0;
const duration = spec.duration ?? 6;
const zoom = spec.zoom ?? 0.03;
const fontPx = spec.fontPx ?? 46;

for (const d of [PUBLIC_DIR, OUTPUT_DIR, TEMP_DIR]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

// 1. Cut + normalize the single clip to vertical 1080x1920.
const baseVideo = path.join(PUBLIC_DIR, `${name}.mp4`);
console.log(`  cut: ${path.basename(clip)} @${start}s for ${duration}s`);
execFileSync("ffmpeg", [
  "-v", "error", "-ss", String(start), "-t", String(duration), "-i", clip,
  "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30",
  "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", baseVideo, "-y",
], { stdio: ["ignore", "ignore", "inherit"] });

// 2. Whole hook as ONE page: all words within a <1200ms window so the caption
//    system keeps them on a single page (gold sweep, then held for the clip).
const words = caption.trim().split(/\s+/);
const SWEEP = 900; // ms for the word-by-word reveal, under the 1200ms page limit
const per = SWEEP / words.length;
const captions = words.map((w, i) => {
  const from = Math.round(150 + i * per);
  const to = Math.round(150 + (i + 1) * per);
  return { text: (i === 0 ? "" : " ") + w, startMs: from, endMs: to, timestampMs: Math.round((from + to) / 2), confidence: 1 };
});
writeFileSync(path.join(PUBLIC_DIR, `${name}.json`), JSON.stringify(captions, null, 2));

// 3. Render with the fixed card font size.
const propsPath = path.join(TEMP_DIR, `${name}.props.json`);
writeFileSync(propsPath, JSON.stringify({ src: `${name}.mp4`, zoom, captionFontPx: fontPx, cardFooter: spec.footer !== false, overlays: [] }));
const outPath = path.join(OUTPUT_DIR, `${name}.mp4`);
console.log("  rendering...");
execFileSync("npx", ["remotion", "render", "src/index.ts", "CaptionedVideo", outPath, `--props=${propsPath}`, "--log=error"], { stdio: "inherit" });
console.log(`  done -> ${path.relative(process.cwd(), outPath)}`);
