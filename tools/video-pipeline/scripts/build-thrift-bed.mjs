// Build the "come thrift with me / class is in session" reel bed: lay Arielle's
// voiceover (audio-only) over a b-roll montage of her thrift clips, so the standard
// make.mjs pipeline can then transcribe it and add captions, price cards, the Chanel
// reference pop, and the headline, all auto-synced to her actual words.
//
//   node scripts/build-thrift-bed.mjs examples/thrift-class.json
//   npm run make thrift-class
//
// What it does:
//   1. Reads the spec (bed order + durations, headline, cues, callouts, trim).
//   2. Finds each bed clip in `clipsDir` by its IMG number (substring match), so it
//      works whether files are named IMG_7951.MOV or <hash>-IMG_7951.mov.
//   3. Cuts + vertical-normalizes each segment (silent), concatenates to the VO length
//      (trimming the last cut to land exactly), then muxes the VO back on as the audio.
//      Output: input/<name>.mp4 (what `npm run make <name>` then consumes).
//   4. Writes the sidecars make.mjs reads: input/<name>.headline.json,
//      input/<name>.trim.json, input/<name>.callouts.json, and input/<name>.cues.json
//      (cues are included ONLY for images that actually exist in input/, so a missing
//      Chanel/interior still never crashes the render).
//
// Prereqs on your machine, before running:
//   - Put the VO at the `vo` path (e.g. input/thrift-bags-vo.m4a).
//   - Drop the clips in `clipsDir` (e.g. input/clips/): IMG_7980, 7957, 7959, 7970,
//     7954, 7951, 7963, 7966, 7967, 7964, 7958, 7971, 7962, 7965, 7950.
//   - Optional images in input/: chanel-255.jpg (a real Chanel 2.55 reference) and
//     mj-inside.jpg (a still of the fake Marc Jacobs interior). Skipped if absent.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { INPUT_DIR } from "../config.mjs";

const specPath = process.argv[2] || "examples/thrift-class.json";
const spec = JSON.parse(readFileSync(path.resolve(specPath), "utf8"));
const name = spec.name;
const resolve = (p) => (path.isAbsolute(p) ? p : path.join(process.cwd(), p));

const ffprobeDur = (f) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])
      .toString()
      .trim(),
  );

// --- locate clips by IMG number in clipsDir -----------------------------------------
const clipsDir = resolve(spec.clipsDir);
if (!existsSync(clipsDir)) {
  console.error(`clipsDir not found: ${clipsDir}\nDrop your thrift clips there first.`);
  process.exit(1);
}
const clipFiles = readdirSync(clipsDir).filter((f) => /\.(mp4|mov|mkv|webm)$/i.test(f));
const findClip = (img) => {
  const key = String(img).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const hit = clipFiles.find((f) => f.toUpperCase().replace(/[^A-Z0-9]/g, "").includes(key));
  return hit ? path.join(clipsDir, hit) : null;
};

// --- 1. VO length is the target ------------------------------------------------------
const voSrc = resolve(spec.vo);
if (!existsSync(voSrc)) {
  console.error(`voiceover not found: ${voSrc}`);
  process.exit(1);
}
const voDur = ffprobeDur(voSrc);
console.log(`  voice: ${path.basename(voSrc)} = ${voDur.toFixed(2)}s -> bed target`);

// --- 2. Resolve the bed, warn on any missing clip -----------------------------------
const missing = [];
const resolvedBed = spec.bed.map((seg) => {
  const clip = findClip(seg.img);
  if (!clip) missing.push(seg.img);
  return { ...seg, clip };
});
if (missing.length) {
  console.error(`\nMissing clips in ${spec.clipsDir}: ${missing.join(", ")}`);
  console.error("Export those from your phone into that folder (any name containing the IMG number).");
  process.exit(1);
}

// --- 3. Walk the bed into cuts summing to voDur -------------------------------------
// Clips are short phone clips, so each cut is CLAMPED to what the clip actually has
// (clipDur - start). We track the clamped total and loop the bed until the VO length is
// filled, so a short clip never leaves the bed shorter than the voice.
const durCache = new Map();
const clipDur = (f) => {
  if (!durCache.has(f)) durCache.set(f, ffprobeDur(f));
  return durCache.get(f);
};
const cuts = [];
let total = 0;
for (let i = 0; total < voDur - 0.05; i++) {
  const seg = resolvedBed[i % resolvedBed.length];
  const start = seg.start ?? 0;
  const avail = Math.max(0.1, clipDur(seg.clip) - start - 0.05);
  let d = Math.min(seg.duration, avail); // never ask for more than the clip has
  if (total + d > voDur) d = voDur - total; // trim last cut to land exactly on the voice
  if (d < 0.2) break;
  cuts.push({ clip: seg.clip, start, duration: d, img: seg.img });
  total += d;
  if (i > resolvedBed.length * 6) break; // safety against a pathological loop
}
console.log(`  bed: ${cuts.length} cuts, ${total.toFixed(1)}s (target ${voDur.toFixed(1)}s)`);

// --- 4. Cut + normalize each (silent) then concat -----------------------------------
const tmpDir = path.join(process.cwd(), "temp", `${name}_bed`);
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });
const listLines = [];
cuts.forEach((seg, idx) => {
  const out = path.join(tmpDir, `seg_${String(idx).padStart(2, "0")}.mp4`);
  console.log(`  cut ${idx}: ${seg.img} @${seg.start}s x${seg.duration.toFixed(1)}s`);
  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-ss", String(seg.start), "-t", String(seg.duration),
      "-i", seg.clip,
      "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30",
      "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast",
      out, "-y",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  listLines.push(`file '${out}'`);
});
const listFile = path.join(tmpDir, "list.txt");
writeFileSync(listFile, listLines.join("\n"));
const silentBed = path.join(tmpDir, "bed.mp4");
execFileSync(
  "ffmpeg",
  ["-v", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", silentBed, "-y"],
  { stdio: ["ignore", "ignore", "inherit"] },
);

// --- 5. Mux the VO onto the bed -> input/<name>.mp4 ---------------------------------
if (!existsSync(INPUT_DIR)) mkdirSync(INPUT_DIR, { recursive: true });
const outVideo = path.join(INPUT_DIR, `${name}.mp4`);
execFileSync(
  "ffmpeg",
  [
    "-v", "error",
    "-i", silentBed,
    "-i", voSrc,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
    "-shortest", "-movflags", "+faststart",
    outVideo, "-y",
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);
console.log(`  bed -> ${path.relative(process.cwd(), outVideo)} (${ffprobeDur(outVideo).toFixed(2)}s, with voice)`);

// --- 6. Write the sidecars make.mjs reads -------------------------------------------
const writeSidecar = (suffix, data) => {
  const p = path.join(INPUT_DIR, `${name}.${suffix}.json`);
  writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`  sidecar -> ${path.relative(process.cwd(), p)}`);
};
if (spec.headline) writeSidecar("headline", spec.headline);
if (spec.trim) writeSidecar("trim", spec.trim);
if (spec.callouts) writeSidecar("callouts", spec.callouts);

// Cues: keep only the ones whose image is actually present in input/, so a missing
// reference image is a skipped pop, never a crash.
if (spec.cues) {
  const present = spec.cues.filter((c) => {
    const img = path.isAbsolute(c.img) ? c.img : path.join(INPUT_DIR, c.img);
    const ok = existsSync(img);
    if (!ok) console.log(`  cue image missing, skipping pop: ${c.img} (drop it in input/ to include it)`);
    return ok;
  });
  if (present.length) writeSidecar("cues", present);
}

console.log(`\nBed ready. Next: npm run make ${name}`);
