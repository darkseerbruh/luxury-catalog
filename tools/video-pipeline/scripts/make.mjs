// One command: raw clips in input/ -> captioned, zoomed, vertical videos in output/.
//
//   npm run make            process every clip in input/
//   npm run make clip.mp4   process just one clip
//
// For image overlays on a clip, drop input/<name>.overlays.json:
//   [{ "img": "bag.png", "fromSec": 1.5, "toSec": 4, "xPct": 50, "yPct": 30, "widthPct": 46 }]
// Put bag.png next to the clip in input/.
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { INPUT_DIR, OUTPUT_DIR, PUBLIC_DIR, TEMP_DIR } from "../config.mjs";
import { transcribeVideo } from "./transcribe.mjs";

const VIDEO_RE = /\.(mp4|mov|mkv|webm)$/i;
const ENTRY = "src/index.ts";
const COMPOSITION = "CaptionedVideo";

const ensureDirs = () => {
  for (const d of [INPUT_DIR, OUTPUT_DIR, PUBLIC_DIR, TEMP_DIR]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }
};

const loadOverlays = (base) => {
  const p = path.join(INPUT_DIR, `${base}.overlays.json`);
  if (!existsSync(p)) return [];
  const overlays = JSON.parse(readFileSync(p, "utf8"));
  // Stage each overlay image into public/ and reference it by basename.
  for (const o of overlays) {
    const srcImg = path.isAbsolute(o.img) ? o.img : path.join(INPUT_DIR, o.img);
    if (existsSync(srcImg)) {
      copyFileSync(srcImg, path.join(PUBLIC_DIR, path.basename(o.img)));
      o.img = path.basename(o.img);
    }
  }
  return overlays;
};

// Normalize for matching: strip accents, lowercase, drop punctuation.
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Speech-cued overlays: input/<base>.cues.json says which image to pop in when a
// phrase is spoken. We find the phrase in the transcript and time the image to it.
//   [{ "say": "this hermes birkin", "img": "birkin.jpg", "hold": 2.5,
//      "xPct": 64, "yPct": 52, "widthPct": 40, "tilt": -4, "delay": 0 }]
const resolveCues = (base) => {
  const cuePath = path.join(INPUT_DIR, `${base}.cues.json`);
  if (!existsSync(cuePath)) return [];
  const capsPath = path.join(PUBLIC_DIR, `${base}.json`);
  if (!existsSync(capsPath)) {
    console.log("  cues: no transcript yet, skipping");
    return [];
  }
  const cues = JSON.parse(readFileSync(cuePath, "utf8"));
  const caps = JSON.parse(readFileSync(capsPath, "utf8"));
  const words = caps
    .map((c) => ({ w: norm(c.text), startMs: c.startMs }))
    .filter((x) => x.w);

  const overlays = [];
  for (const cue of cues) {
    const phrase = norm(cue.say).split(" ").filter(Boolean);
    let hit = -1;
    for (let i = 0; i + phrase.length <= words.length; i++) {
      let ok = true;
      for (let j = 0; j < phrase.length; j++) {
        if (words[i + j].w !== phrase[j]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        hit = i;
        break;
      }
    }
    if (hit < 0) {
      console.log(`  cue: phrase not found in speech -> "${cue.say}"`);
      continue;
    }
    const srcImg = path.isAbsolute(cue.img) ? cue.img : path.join(INPUT_DIR, cue.img);
    if (existsSync(srcImg)) {
      copyFileSync(srcImg, path.join(PUBLIC_DIR, path.basename(cue.img)));
    }
    const startSec = words[hit].startMs / 1000 + (cue.delay ?? 0);
    overlays.push({
      img: path.basename(cue.img),
      fromSec: startSec,
      toSec: startSec + (cue.hold ?? 2.5),
      xPct: cue.xPct,
      yPct: cue.yPct,
      widthPct: cue.widthPct,
      tilt: cue.tilt,
    });
    console.log(`  cue: "${cue.say}" -> ${startSec.toFixed(2)}s (${path.basename(cue.img)})`);
  }
  return overlays;
};

const processClip = async (fileName) => {
  const base = fileName.replace(VIDEO_RE, "");
  const inputPath = path.join(INPUT_DIR, fileName);
  const publicVideo = path.join(PUBLIC_DIR, fileName);
  const outPath = path.join(OUTPUT_DIR, `${base}.mp4`);

  console.log(`\n== ${fileName} ==`);

  // 1. Stage the clip where Remotion serves static files from.
  copyFileSync(inputPath, publicVideo);

  // 2. Transcribe -> public/<base>.json (skip if already done).
  const jsonPath = path.join(PUBLIC_DIR, `${base}.json`);
  if (existsSync(jsonPath)) {
    console.log("  captions: cached");
  } else {
    console.log("  captions: transcribing with Whisper...");
    await transcribeVideo(publicVideo);
  }

  // 3. Overlays: static (input/<base>.overlays.json) + speech-cued (<base>.cues.json).
  const overlays = [...loadOverlays(base), ...resolveCues(base)];

  // 4. Render.
  const propsPath = path.join(TEMP_DIR, `${base}.props.json`);
  writeFileSync(propsPath, JSON.stringify({ src: fileName, overlays }));
  console.log("  rendering...");
  execFileSync(
    "npx",
    [
      "remotion",
      "render",
      ENTRY,
      COMPOSITION,
      outPath,
      `--props=${propsPath}`,
      "--log=error",
    ],
    { stdio: "inherit" },
  );
  console.log(`  done -> ${path.relative(process.cwd(), outPath)}`);
};

const main = async () => {
  ensureDirs();
  const only = process.argv[2];
  const clips = only
    ? [only]
    : readdirSync(INPUT_DIR).filter((f) => VIDEO_RE.test(f));

  if (clips.length === 0) {
    console.log("No clips found in input/. Drop .mp4 / .mov files there first.");
    return;
  }
  for (const clip of clips) {
    await processClip(clip);
  }
  console.log(`\nAll done. Finished videos are in ${path.relative(process.cwd(), OUTPUT_DIR)}/`);
};

await main();
