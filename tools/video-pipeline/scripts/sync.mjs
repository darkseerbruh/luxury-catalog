// Combine phone video with clean computer audio, auto-aligned. The phone's own
// (scratch) audio is the sync key: we cross-correlate it with the computer audio
// to find the offset, then mux the phone video with the good audio in sync.
//
//   npm run sync phone.mov mic.wav [outName]
//
// Output: input/<outName or phone>.synced.mp4, ready for split/make.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { INPUT_DIR } from "../config.mjs";

const [phoneArg, audioArg, outArg] = process.argv.slice(2);
if (!phoneArg || !audioArg) {
  console.error("Usage: node scripts/sync.mjs <phoneVideo> <computerAudio> [outName]");
  process.exit(1);
}
const phone = path.isAbsolute(phoneArg) ? phoneArg : path.join(INPUT_DIR, phoneArg);
const audio = path.isAbsolute(audioArg) ? audioArg : path.join(INPUT_DIR, audioArg);
for (const f of [phone, audio]) {
  if (!existsSync(f)) {
    console.error(`Not found: ${f}`);
    process.exit(1);
  }
}

const SR = 8000; // work at 8kHz mono
const ENV_RATE = 250; // envelope samples per second
const BLOCK = SR / ENV_RATE; // samples per envelope point
const MAX_LAG_SEC = 20;

// Decode a file to a mono 8kHz amplitude envelope.
const envelope = (file) => {
  const raw = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "s16le", "-"],
    { maxBuffer: 1 << 30 },
  );
  const pcm = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
  const env = new Float32Array(Math.floor(pcm.length / BLOCK));
  for (let i = 0; i < env.length; i++) {
    let s = 0;
    for (let j = 0; j < BLOCK; j++) s += Math.abs(pcm[i * BLOCK + j]);
    env[i] = s / BLOCK;
  }
  // zero-mean for normalized cross-correlation
  let mean = 0;
  for (const v of env) mean += v;
  mean /= env.length || 1;
  for (let i = 0; i < env.length; i++) env[i] -= mean;
  return env;
};

// Best lag (in envelope samples) of B relative to A via normalized cross-correlation.
const bestLag = (a, b) => {
  const maxLag = MAX_LAG_SEC * ENV_RATE;
  let best = 0;
  let bestScore = -Infinity;
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let dot = 0;
    let ea = 0;
    let eb = 0;
    const start = Math.max(0, -lag);
    const end = Math.min(a.length, b.length - lag);
    if (end - start < ENV_RATE) continue; // need at least ~1s overlap
    for (let i = start; i < end; i++) {
      const av = a[i];
      const bv = b[i + lag];
      dot += av * bv;
      ea += av * av;
      eb += bv * bv;
    }
    const score = dot / (Math.sqrt(ea * eb) || 1);
    if (score > bestScore) {
      bestScore = score;
      best = lag;
    }
  }
  return { lag: best, score: bestScore };
};

console.log("  reading audio...");
const phoneEnv = envelope(phone);
const audioEnv = envelope(audio);
console.log("  aligning...");
const { lag, score } = bestLag(phoneEnv, audioEnv);
// lag/ENV_RATE is where the computer content sits on the phone timeline. Negative
// means the computer audio leads (its speech is earlier), so we push it later; the
// amount to move the computer audio forward in time is the negation.
const offsetSec = lag / ENV_RATE;
const shift = -offsetSec;
console.log(
  `  offset ${offsetSec.toFixed(3)}s -> ${shift >= 0 ? "delay" : "advance"} computer audio by ${Math.abs(shift).toFixed(3)}s (match ${score.toFixed(3)})`,
);

const base = (outArg || path.basename(phone).replace(/\.[^.]+$/, "")).replace(/\.[^.]+$/, "");
const out = path.join(INPUT_DIR, `${base}.synced.mp4`);

// shift >= 0 -> delay the computer audio; shift < 0 -> skip into it.
const audioInput = shift >= 0
  ? ["-itsoffset", shift.toFixed(3), "-i", audio]
  : ["-ss", (-shift).toFixed(3), "-i", audio];

execFileSync(
  "ffmpeg",
  [
    "-v", "error",
    "-i", phone,
    ...audioInput,
    "-map", "0:v",
    "-map", "1:a",
    "-c:v", "copy",
    "-c:a", "aac",
    "-shortest",
    out, "-y",
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);
console.log(`  done -> ${path.relative(process.cwd(), out)}`);
console.log("\nNext: npm run make " + path.basename(out));
