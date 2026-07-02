// Split one recording of several takes into separate clips, cutting on the silent
// pauses between takes. Then run `npm run make` to caption/render them all.
//
//   npm run split session.mp4            # uses defaults
//   npm run split session.mp4 -35 1.4    # noise floor (dB), min pause (s)
//
// Leave ~2s of silence between takes when filming. Takes shorter than MIN_TAKE are
// dropped as throat-clears. Output: input/<base>_take01.mp4, _take02.mp4, ...
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { INPUT_DIR } from "../config.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/split.mjs <recording> [noiseDb] [minPauseSec]");
  process.exit(1);
}
const NOISE_DB = process.argv[3] ?? "-30"; // below this is "silence"
const MIN_PAUSE = Number(process.argv[4] ?? 1.2); // silence this long = a cut
const MIN_TAKE = 1.0; // drop takes shorter than this (seconds)
const PAD = 0.15; // keep a hair before/after so words are not clipped

const input = path.isAbsolute(file) ? file : path.join(INPUT_DIR, file);
if (!existsSync(input)) {
  console.error(`Not found: ${input}`);
  process.exit(1);
}
const base = path.basename(input).replace(/\.[^.]+$/, "");

const dur = Number(
  execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", input],
    { encoding: "utf8" },
  ).trim(),
);

// Detect silence via ffmpeg silencedetect (it logs to stderr even on success).
const res = spawnSync(
  "ffmpeg",
  ["-i", input, "-af", `silencedetect=noise=${NOISE_DB}dB:d=${MIN_PAUSE}`, "-f", "null", "-"],
  { encoding: "utf8" },
);
const log = (res.stderr || "") + (res.stdout || "");

const silences = [];
let curStart = null;
for (const line of log.split("\n")) {
  const s = line.match(/silence_start:\s*([\d.]+)/);
  const en = line.match(/silence_end:\s*([\d.]+)/);
  if (s) curStart = Number(s[1]);
  if (en && curStart !== null) {
    silences.push({ start: curStart, end: Number(en[1]) });
    curStart = null;
  }
}

// Takes are the spans BETWEEN the silences (and before the first / after the last).
const starts = [0, ...silences.map((x) => x.end)];
const ends = [...silences.map((x) => x.start), dur];
const takes = [];
for (let i = 0; i < starts.length; i++) {
  const from = Math.max(0, starts[i] - PAD);
  const to = Math.min(dur, ends[i] + PAD);
  if (to - from >= MIN_TAKE) takes.push({ from, to });
}

if (takes.length <= 1) {
  console.log(
    `Found ${takes.length} take(s). If you expected more, leave a longer pause between ` +
      `takes or lower the pause threshold, e.g. npm run split ${file} ${NOISE_DB} 0.8`,
  );
}

takes.forEach((t, i) => {
  const n = String(i + 1).padStart(2, "0");
  const out = path.join(INPUT_DIR, `${base}_take${n}.mp4`);
  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-i", input,
      "-ss", String(t.from),
      "-to", String(t.to),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      out, "-y",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(`  take ${n}: ${t.from.toFixed(2)}s -> ${t.to.toFixed(2)}s  (${path.basename(out)})`);
});

console.log(`\nSplit into ${takes.length} take(s). Now run: npm run make`);
