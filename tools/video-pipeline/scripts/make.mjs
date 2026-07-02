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
import {
  HEIGHT,
  INPUT_DIR,
  OUTPUT_DIR,
  PUBLIC_DIR,
  TEMP_DIR,
  WIDTH,
} from "../config.mjs";
import { cutout } from "./cutout.mjs";
import { transcribeVideo } from "./transcribe.mjs";

const HANDTRACK_BIN = path.join(process.cwd(), "bin", "handtrack");
const HANDTRACK_SRC = path.join(process.cwd(), "native", "handtrack.swift");

// Build the Swift hand tracker on first use (like Whisper: source in git, binary local).
const ensureHandtrack = () => {
  if (existsSync(HANDTRACK_BIN)) return;
  if (!existsSync(path.join(process.cwd(), "bin"))) mkdirSync("bin");
  console.log("  building hand tracker (one time)...");
  execFileSync("swiftc", ["-O", HANDTRACK_SRC, "-o", HANDTRACK_BIN], {
    stdio: ["ignore", "ignore", "inherit"],
  });
};

// Run the tracker on a vertical clip -> [{t, xPct, yPct}] in output coordinates.
const trackCache = new Map();
const getHandTrack = (videoPath) => {
  if (trackCache.has(videoPath)) return trackCache.get(videoPath);
  ensureHandtrack();
  const out = execFileSync(HANDTRACK_BIN, [videoPath], { encoding: "utf8" });
  const track = JSON.parse(out);
  trackCache.set(videoPath, track);
  return track;
};

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

// Fix proper names in the captions so they never depend on the transcriber. Applies
// the global luxury-lexicon.json plus an optional per-clip <base>.corrections.json.
// Matched case/accent-insensitively across word tokens; timing is preserved.
const LEXICON_PATH = path.join(process.cwd(), "luxury-lexicon.json");
const applyCorrections = (base) => {
  const capsPath = path.join(PUBLIC_DIR, `${base}.json`);
  if (!existsSync(capsPath)) return;
  const lex = existsSync(LEXICON_PATH) ? JSON.parse(readFileSync(LEXICON_PATH, "utf8")) : {};
  const perClipPath = path.join(INPUT_DIR, `${base}.corrections.json`);
  const perClip = existsSync(perClipPath) ? JSON.parse(readFileSync(perClipPath, "utf8")) : {};
  const map = {};
  for (const [k, v] of Object.entries({ ...lex, ...perClip })) {
    if (!k.startsWith("_")) map[norm(k)] = v;
  }
  // Longer phrases first so multi-word names win over their fragments.
  const entries = Object.entries(map).sort(
    (a, b) => b[0].split(" ").length - a[0].split(" ").length,
  );
  let caps = JSON.parse(readFileSync(capsPath, "utf8"));
  let changed = false;
  for (const [phrase, replacement] of entries) {
    const pw = phrase.split(" ");
    for (let i = 0; i + pw.length <= caps.length; i++) {
      let match = true;
      for (let j = 0; j < pw.length; j++) {
        if (norm(caps[i + j].text) !== pw[j]) {
          match = false;
          break;
        }
      }
      if (!match) continue;
      // Already correct? skip (keeps it idempotent across re-runs).
      const current = caps.slice(i, i + pw.length).map((t) => t.text.trim()).join(" ");
      if (current === replacement) continue;
      const lead = caps[i].text.startsWith(" ") ? " " : "";
      const from = caps[i].startMs;
      const to = caps[i + pw.length - 1].endMs;
      const words = replacement.split(/\s+/);
      const per = (to - from) / words.length;
      const toks = words.map((w, k) => ({
        text: (k === 0 ? lead : " ") + w,
        startMs: Math.round(from + k * per),
        endMs: Math.round(from + (k + 1) * per),
        timestampMs: Math.round(from + (k + 0.5) * per),
        confidence: 1,
      }));
      caps.splice(i, pw.length, ...toks);
      i += toks.length - 1;
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(capsPath, JSON.stringify(caps, null, 2));
    console.log("  captions: applied name corrections");
  }
};

// Speech-cued overlays: input/<base>.cues.json says which image to pop in when a
// phrase is spoken. We find the phrase in the transcript and time the image to it.
//   [{ "say": "this hermes birkin", "img": "birkin.jpg", "hold": 2.5,
//      "xPct": 64, "yPct": 52, "widthPct": 40, "tilt": -4, "delay": 0 }]
const resolveCues = async (base, publicVideo) => {
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

    // Image: cut out the background (default) so the bag floats, unless opted out.
    const srcImg = path.isAbsolute(cue.img) ? cue.img : path.join(INPUT_DIR, cue.img);
    let imgName;
    if (cue.cutout === false) {
      imgName = path.basename(cue.img);
      if (existsSync(srcImg)) copyFileSync(srcImg, path.join(PUBLIC_DIR, imgName));
    } else {
      console.log(`  cutout: ${path.basename(cue.img)}...`);
      const cutPath = await cutout(srcImg);
      imgName = path.basename(cutPath);
      copyFileSync(cutPath, path.join(PUBLIC_DIR, imgName));
    }

    const startSec = words[hit].startMs / 1000 + (cue.delay ?? 0);
    const overlay = {
      img: imgName,
      label: cue.label,
      fromSec: startSec,
      // Default: hold until the next cue (the whole time she talks about it).
      // An explicit "hold" pins a fixed duration instead.
      toSec: startSec + (cue.hold ?? 6),
      _auto: cue.hold === undefined,
      xPct: cue.xPct,
      yPct: cue.yPct,
      widthPct: cue.widthPct,
      tilt: cue.tilt,
      cutout: cue.cutout !== false,
    };

    // Follow the hand: attach the tracked palm path over the cue window.
    if (cue.follow) {
      console.log("  follow: tracking hand...");
      const track = getHandTrack(publicVideo).filter(
        (p) => p.t >= startSec - 0.3 && p.t <= toSec + 0.3,
      );
      if (track.length) overlay.track = track;
      else console.log("  follow: no confident hand in that window, using fixed position");
    }

    overlays.push(overlay);
    console.log(
      `  cue: "${cue.say}" -> ${startSec.toFixed(2)}s (${imgName})${cue.follow ? " [follow]" : ""}`,
    );
  }

  // Auto-hold each bag until the next one appears; the last one holds ~8s.
  overlays.sort((a, b) => a.fromSec - b.fromSec);
  for (let i = 0; i < overlays.length; i++) {
    if (overlays[i]._auto) {
      overlays[i].toSec =
        i < overlays.length - 1
          ? Math.max(overlays[i].fromSec + 1.5, overlays[i + 1].fromSec - 0.25)
          : overlays[i].fromSec + 8;
    }
    delete overlays[i]._auto;
  }
  return overlays;
};

// Rank tracker: input/<base>.ranks.json lists the chip labels and the phrase that
// reveals each rank; we resolve the phrases to times from the transcript.
//   { "labels": ["4","3","2","1"],
//     "fillAt": ["fourth place","third place","second place","the neverful"],
//     "yPct": 12 }
const resolveRanks = (base) => {
  const p = path.join(INPUT_DIR, `${base}.ranks.json`);
  if (!existsSync(p)) return undefined;
  const capsPath = path.join(PUBLIC_DIR, `${base}.json`);
  if (!existsSync(capsPath)) return undefined;
  const cfg = JSON.parse(readFileSync(p, "utf8"));
  const caps = JSON.parse(readFileSync(capsPath, "utf8"));
  const words = caps
    .map((c) => ({ w: norm(c.text), t: c.startMs / 1000 }))
    .filter((x) => x.w);
  const find = (phrase) => {
    const ph = norm(phrase).split(" ").filter(Boolean);
    for (let i = 0; i + ph.length <= words.length; i++) {
      let ok = true;
      for (let j = 0; j < ph.length; j++) {
        if (words[i + j].w !== ph[j]) {
          ok = false;
          break;
        }
      }
      if (ok) return words[i].t;
    }
    return null;
  };
  const fillTimes = cfg.fillAt.map((f) => {
    const t = find(f);
    if (t === null) console.log(`  rank: phrase not found -> "${f}"`);
    return t ?? 0;
  });
  console.log(`  ranks: ${cfg.labels.join(" ")} at ${fillTimes.map((t) => t.toFixed(1)).join(", ")}s`);
  return { labels: cfg.labels, fillTimes, yPct: cfg.yPct };
};

const processClip = async (fileName) => {
  const base = fileName.replace(VIDEO_RE, "");
  const inputPath = path.join(INPUT_DIR, fileName);
  const publicVideo = path.join(PUBLIC_DIR, fileName);
  const outPath = path.join(OUTPUT_DIR, `${base}.mp4`);

  console.log(`\n== ${fileName} ==`);

  // 1. Normalize to vertical 1080x1920 so captions, overlays, and hand tracking all
  //    share the same output coordinate space, and stage it for Remotion to serve.
  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-i", inputPath,
      "-vf",
      `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1`,
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      publicVideo, "-y",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );

  // 2. Transcribe -> public/<base>.json (skip if already done).
  const jsonPath = path.join(PUBLIC_DIR, `${base}.json`);
  if (existsSync(jsonPath)) {
    console.log("  captions: cached");
  } else {
    console.log("  captions: transcribing with Whisper...");
    await transcribeVideo(publicVideo);
  }

  // 2b. Fix proper names in the captions (brands, French terms) before anything
  //     reads them, so cues/ranks and the on-screen text all use correct spelling.
  applyCorrections(base);

  // 3. Overlays: static (input/<base>.overlays.json) + speech-cued (<base>.cues.json).
  const overlays = [...loadOverlays(base), ...(await resolveCues(base, publicVideo))];

  // 4. Render.
  const rankTracker = resolveRanks(base);
  const propsPath = path.join(TEMP_DIR, `${base}.props.json`);
  writeFileSync(
    propsPath,
    JSON.stringify({ src: fileName, overlays, ...(rankTracker ? { rankTracker } : {}) }),
  );
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
