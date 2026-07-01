// Local, offline transcription with Whisper.cpp. Installs Whisper + the model on
// first run (idempotent), extracts 16kHz mono audio, and writes word-level
// captions as <name>.json into public/ next to the video.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import {
  PUBLIC_DIR,
  TEMP_DIR,
  WHISPER_LANG,
  WHISPER_MODEL,
  WHISPER_PATH,
  WHISPER_VERSION,
} from "../config.mjs";

let whisperReady = false;

export const ensureWhisper = async () => {
  if (whisperReady) return;
  await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
  await downloadWhisperModel({ folder: WHISPER_PATH, model: WHISPER_MODEL });
  whisperReady = true;
};

// videoPath: absolute path to a video file already copied into public/.
// Returns the absolute path to the written captions .json.
export const transcribeVideo = async (videoPath) => {
  await ensureWhisper();
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

  const base = path.basename(videoPath).replace(/\.[^.]+$/, "");
  const wavPath = path.join(TEMP_DIR, `${base}.wav`);
  const jsonPath = path.join(PUBLIC_DIR, `${base}.json`);

  // 16kHz mono wav is what Whisper.cpp expects.
  execSync(`ffmpeg -i "${videoPath}" -ar 16000 -ac 1 "${wavPath}" -y`, {
    stdio: ["ignore", "ignore", "inherit"],
  });

  const whisperCppOutput = await transcribe({
    inputPath: wavPath,
    model: WHISPER_MODEL,
    tokenLevelTimestamps: true,
    whisperPath: WHISPER_PATH,
    whisperCppVersion: WHISPER_VERSION,
    printOutput: false,
    translateToEnglish: false,
    language: WHISPER_LANG,
    splitOnWord: true,
  });

  const { captions } = toCaptions({ whisperCppOutput });
  writeFileSync(jsonPath, JSON.stringify(captions, null, 2));
  return jsonPath;
};

// Allow running standalone: `node scripts/transcribe.mjs public/clip.mp4`
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/transcribe.mjs <path-to-video-in-public>");
    process.exit(1);
  }
  const out = await transcribeVideo(path.resolve(arg));
  console.log("Wrote", out);
}
