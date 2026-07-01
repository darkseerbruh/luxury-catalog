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
    const srcImg = path.join(INPUT_DIR, o.img);
    if (existsSync(srcImg)) {
      copyFileSync(srcImg, path.join(PUBLIC_DIR, path.basename(o.img)));
      o.img = path.basename(o.img);
    }
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

  // 3. Overlays (optional).
  const overlays = loadOverlays(base);

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
