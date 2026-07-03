// Fast automated QA for a finished reel, so bugs are caught in seconds instead of by
// eye after a full render. Checks the three failure modes that cost real iteration time:
//   1. audio present           (a talking-head reel must keep her voice)
//   2. opens on her first word  (no dead-air / room-tone head)
//   3. captions match the audio (the sync-delay bug: captions ran ahead of the voice)
//
//   node scripts/verify.mjs <clip-base>       e.g. chanel1.synced
//   node scripts/verify.mjs output/foo.mp4    (a path also works)
//
// Exit code is non-zero if any check fails, so it can gate delivery.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { OUTPUT_DIR, PUBLIC_DIR } from "../config.mjs";

const WHISPER_BIN = path.join(process.cwd(), "whisper.cpp", "main");
const WHISPER_MODEL = path.join(process.cwd(), "whisper.cpp", "ggml-base.en.bin");
const tmp = mkdtempSync(path.join(os.tmpdir(), "verify-"));

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/verify.mjs <clip-base | output/file.mp4>");
  process.exit(2);
}
const base = arg.replace(/^output\//, "").replace(/\.(mp4|mov)$/i, "");
const video = arg.includes("/") ? arg : path.join(OUTPUT_DIR, `${base}.mp4`);
const capsPath = path.join(PUBLIC_DIR, `${base}.json`);
if (!existsSync(video)) {
  console.error(`not found: ${video}`);
  process.exit(2);
}

const norm = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const probe = (stream, key) =>
  execFileSync("ffprobe", ["-v", "error", "-select_streams", stream, "-show_entries", `stream=${key}`, "-of", "default=nk=1:nw=1", video], { encoding: "utf8" }).trim();

const pcm = (ss, t) => {
  const raw = execFileSync("ffmpeg", ["-v", "error", ...(ss != null ? ["-ss", String(ss)] : []), ...(t != null ? ["-t", String(t)] : []), "-i", video, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1 << 30 });
  return new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
};

const whisper = (ss, t) => {
  const wav = path.join(tmp, "s.wav");
  execFileSync("ffmpeg", ["-v", "error", "-ss", String(ss), "-t", String(t), "-i", video, "-ar", "16000", "-ac", "1", wav, "-y"]);
  // whisper.cpp logs model init to stderr; capture stdout only and drop the rest.
  return execFileSync(WHISPER_BIN, ["-m", WHISPER_MODEL, "-f", wav, "-nt"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).replace(/\[.*?\]/g, " ");
};

let failed = 0;
const check = (name, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};

console.log(`\nverify ${path.relative(process.cwd(), video)}`);

// 1. audio present
const aCodec = probe("a", "codec_name");
check("audio present", !!aCodec, aCodec || "no audio stream");

// 2. opens on speech (first sustained loud block within 0.35s)
const head = pcm(0, 3);
const N = 320; // 20ms
const peaks = [];
for (let i = 0; i < Math.floor(head.length / N); i++) { let mx = 0; for (let j = 0; j < N; j++) mx = Math.max(mx, Math.abs(head[i * N + j])); peaks.push(mx); }
const loud = [...peaks].filter((p) => p > 1500).sort((a, b) => a - b);
const speech = loud.length ? loud[Math.floor(loud.length * 0.85)] : 12000;
const THR = Math.max(7000, speech * 0.4);
let onset = 99;
for (let i = 0; i < peaks.length - 5; i++) { if (peaks.slice(i, i + 5).every((p) => p >= THR)) { onset = (i * N) / 16000; break; } }
check("opens on first word (no dead air)", onset <= 0.35, `speech at ${onset.toFixed(2)}s`);

// 3. captions match audio at 3 sample points
if (!existsSync(capsPath)) {
  check("captions match audio", false, `no caption json at ${capsPath} (pass a base name that has one)`);
} else {
  const caps = JSON.parse(readFileSync(capsPath, "utf8"));
  const dur = Number(probe("v", "duration")) || Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", video], { encoding: "utf8" }).trim());
  for (const frac of [0.25, 0.5, 0.75]) {
    const at = +(dur * frac).toFixed(1);
    const capWords = new Set(norm(caps.filter((w) => w.startMs / 1000 >= at && w.startMs / 1000 <= at + 3).map((w) => w.text).join(" ")).split(" ").filter(Boolean));
    const heard = new Set(norm(whisper(at, 3)).split(" ").filter(Boolean));
    if (capWords.size < 2) continue;
    let hit = 0; for (const w of capWords) if (heard.has(w)) hit++;
    const overlap = hit / capWords.size;
    check(`captions match audio @ ${at}s`, overlap >= 0.5, `${Math.round(overlap * 100)}% word overlap`);
  }
}

console.log(failed ? `\n${failed} check(s) FAILED\n` : "\nall checks passed\n");
process.exit(failed ? 1 : 0);
