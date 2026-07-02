// Build a headless (faceless) montage from your own clips + a scripted caption per
// segment, then render it through the same brand caption style.
//
//   node scripts/montage.mjs examples/hermes-icons.json
//
// Spec shape:
// {
//   "name": "hermes-icons",
//   "zoom": 0.03,
//   "segments": [
//     { "clip": "/abs/path/clip.mp4", "start": 2.0, "duration": 2.2, "caption": "The Birkin" }
//   ]
// }
// Each segment is trimmed, cropped to vertical 1080x1920, and concatenated. The
// caption words are timed to the first part of each segment so every label reads
// as its own page (word-by-word gold highlight), held until the next label.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { OUTPUT_DIR, PUBLIC_DIR, TEMP_DIR } from "../config.mjs";

const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage: node scripts/montage.mjs <spec.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(path.resolve(specPath), "utf8"));
const name = spec.name;
const zoom = spec.zoom ?? 0.03;

for (const d of [PUBLIC_DIR, OUTPUT_DIR, TEMP_DIR]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

// 1. Normalize each segment to identical vertical params so concat is clean.
const segDir = path.join(TEMP_DIR, `${name}_segs`);
rmSync(segDir, { recursive: true, force: true });
mkdirSync(segDir, { recursive: true });

const listLines = [];
spec.segments.forEach((seg, i) => {
  const out = path.join(segDir, `seg_${i}.mp4`);
  console.log(`  cut ${i}: ${path.basename(seg.clip)} -> "${seg.caption}"`);
  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-ss", String(seg.start ?? 0),
      "-t", String(seg.duration),
      "-i", seg.clip,
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30",
      "-an",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-preset", "veryfast",
      out, "-y",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  listLines.push(`file '${out}'`);
});

// 2. Concatenate into the base video Remotion will serve.
const listFile = path.join(segDir, "list.txt");
writeFileSync(listFile, listLines.join("\n"));
const baseVideo = path.join(PUBLIC_DIR, `${name}.mp4`);
execFileSync(
  "ffmpeg",
  ["-v", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", baseVideo, "-y"],
  { stdio: ["ignore", "ignore", "inherit"] },
);

// 3. Author captions.json timed to each segment.
// createTikTokStyleCaptions starts a new page when a token begins with a space
// AND the current page's span already exceeds combineTokensWithinMilliseconds
// (1200ms in the composition). It ignores the time gap between tokens. So each
// label's total span must cross 1200ms exactly as the next label starts, while
// no single word pushes it over early. LABEL_SPAN = 1350ms distributed evenly
// does that for labels up to ~8 words. Every word also needs a leading space.
const LABEL_SPAN = 1350;
const captions = [];
let offset = 0;
for (const seg of spec.segments) {
  const D = seg.duration * 1000;
  const words = seg.caption.trim().split(/\s+/);
  const wStart = offset + 150;
  const per = LABEL_SPAN / words.length;
  words.forEach((w, i) => {
    const from = Math.round(wStart + i * per);
    const to = Math.round(wStart + (i + 1) * per);
    captions.push({
      text: " " + w,
      startMs: from,
      endMs: to,
      timestampMs: Math.round((from + to) / 2),
      confidence: 1,
    });
  });
  offset += D;
}
writeFileSync(path.join(PUBLIC_DIR, `${name}.json`), JSON.stringify(captions, null, 2));

// 4. Render.
const propsPath = path.join(TEMP_DIR, `${name}.props.json`);
writeFileSync(propsPath, JSON.stringify({ src: `${name}.mp4`, zoom, overlays: [] }));
const outPath = path.join(OUTPUT_DIR, `${name}.mp4`);
console.log("  rendering...");
execFileSync(
  "npx",
  ["remotion", "render", "src/index.ts", "CaptionedVideo", outPath, `--props=${propsPath}`, "--log=error"],
  { stdio: "inherit" },
);
console.log(`  done -> ${path.relative(process.cwd(), outPath)}`);
