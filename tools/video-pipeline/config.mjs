import path from "node:path";

// ---- Whisper (local, offline transcription) ----
export const WHISPER_PATH = path.join(process.cwd(), "whisper.cpp");
export const WHISPER_VERSION = "1.6.0";
// base.en is fast + accurate enough for clear talking-head audio (142 MB).
// Bump to "medium.en" for the highest accuracy (1.5 GB, slower).
export const WHISPER_MODEL = "base.en";
export const WHISPER_LANG = "en";

// ---- Pipeline folders ----
export const INPUT_DIR = path.join(process.cwd(), "input");
export const OUTPUT_DIR = path.join(process.cwd(), "output");
export const PUBLIC_DIR = path.join(process.cwd(), "public");
export const TEMP_DIR = path.join(process.cwd(), "temp");

// ---- Output format ----
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
