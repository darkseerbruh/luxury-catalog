// Build the FOUNDER-FACE VARIANT of an existing voiceover/opinion piece: lay an
// existing spoken-opinion audio track + its already-synced captions over a founder
// b-roll bed (her at the desk, bag wall behind), instead of a faceless slideshow.
// This is variant B of the visual-bed A/B (docs/social-content-calendar.md 3.6).
//
//   node scripts/montage-vo.mjs examples/gucci-myth-founder.json
//
// Spec shape:
// {
//   "name": "gucci-myth-founder",
//   "audioFrom": "output/gucci-myth.synced.mp4",   // the voice to reuse (video or audio)
//   "captionsFrom": "public/gucci-myth.synced.json",// existing word-timed captions to reuse
//   "propsFrom": "temp/gucci-myth.synced.props.json",// optional: reuse headline/callouts
//   "zoom": 0.03,
//   "bed": [ { "clip": "/abs/clip.mp4", "start": 0.3, "duration": 3.2 }, ... ]
// }
//
// The bed is cut to vertical 1080x1920 (silent), concatenated, looped if shorter than
// the audio, then hard-trimmed to the exact audio length so captions + headline stay in
// sync. The composition is rendered silent, then the original audio is muxed back on.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { OUTPUT_DIR, PUBLIC_DIR, TEMP_DIR } from "../config.mjs";

const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage: node scripts/montage-vo.mjs <spec.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(path.resolve(specPath), "utf8"));
const name = spec.name;
const zoom = spec.zoom ?? 0.03;
const resolve = (p) => (path.isAbsolute(p) ? p : path.join(process.cwd(), p));

for (const d of [PUBLIC_DIR, OUTPUT_DIR, TEMP_DIR]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

const ffprobeDur = (f) =>
  Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f,
    ]).toString().trim(),
  );

// 1. How long does the bed need to be? Match the voice exactly.
const audioSrc = resolve(spec.audioFrom);
if (!existsSync(audioSrc)) {
  console.error(`audioFrom not found: ${audioSrc}`);
  process.exit(1);
}
const audioDur = ffprobeDur(audioSrc);
console.log(`  voice: ${path.basename(audioSrc)} = ${audioDur.toFixed(2)}s -> bed target`);

// 2. Walk the bed list (looping if needed) into concrete cuts summing to audioDur.
const cuts = [];
let total = 0;
let i = 0;
while (total < audioDur) {
  const seg = spec.bed[i % spec.bed.length];
  let d = seg.duration;
  if (total + d > audioDur) d = audioDur - total; // trim last cut to land exactly
  if (d < 0.1) break;
  cuts.push({ clip: seg.clip, start: seg.start ?? 0, duration: d });
  total += d;
  i++;
}

// 3. Cut + normalize each to identical vertical params (silent) so concat is clean.
const segDir = path.join(TEMP_DIR, `${name}_segs`);
rmSync(segDir, { recursive: true, force: true });
mkdirSync(segDir, { recursive: true });
const listLines = [];
cuts.forEach((seg, idx) => {
  const out = path.join(segDir, `seg_${idx}.mp4`);
  console.log(`  cut ${idx}: ${path.basename(seg.clip)} @${seg.start}s x${seg.duration.toFixed(1)}s`);
  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-ss", String(seg.start), "-t", String(seg.duration),
      "-i", resolve(seg.clip),
      "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30",
      "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast",
      out, "-y",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  listLines.push(`file '${out}'`);
});

// 4. Concatenate into the silent base video Remotion will serve.
const listFile = path.join(segDir, "list.txt");
writeFileSync(listFile, listLines.join("\n"));
const baseVideo = path.join(PUBLIC_DIR, `${name}.mp4`);
execFileSync(
  "ffmpeg",
  ["-v", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", baseVideo, "-y"],
  { stdio: ["ignore", "ignore", "inherit"] },
);
console.log(`  bed -> ${path.relative(process.cwd(), baseVideo)} (${ffprobeDur(baseVideo).toFixed(2)}s)`);

// 5. Reuse the existing word-timed captions verbatim (same voice = same timings).
copyFileSync(resolve(spec.captionsFrom), path.join(PUBLIC_DIR, `${name}.json`));

// 6. Props: reuse headline/callouts from the control render if given, swap src to our bed.
let props = { overlays: [], callouts: [] };
if (spec.propsFrom && existsSync(resolve(spec.propsFrom))) {
  props = JSON.parse(readFileSync(resolve(spec.propsFrom), "utf8"));
}
props.src = `${name}.mp4`;
props.zoom = zoom;
props.overlays = []; // founder variant is a clean face bed, no image overlays
const propsPath = path.join(TEMP_DIR, `${name}.props.json`);
writeFileSync(propsPath, JSON.stringify(props));

// 7. Render the captioned (silent) video.
const silentOut = path.join(TEMP_DIR, `${name}.silent.mp4`);
console.log("  rendering captioned bed...");
execFileSync(
  "npx",
  ["remotion", "render", "src/index.ts", "CaptionedVideo", silentOut, `--props=${propsPath}`, "--log=error"],
  { stdio: "inherit" },
);

// 8. Mux the original voice back on (trim to the shorter of the two).
const finalOut = path.join(OUTPUT_DIR, `${name}.mp4`);
execFileSync(
  "ffmpeg",
  [
    "-v", "error",
    "-i", silentOut,
    "-i", audioSrc,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
    "-shortest", "-movflags", "+faststart",
    finalOut, "-y",
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);
console.log(`  done -> ${path.relative(process.cwd(), finalOut)} (${ffprobeDur(finalOut).toFixed(2)}s, with voice)`);
