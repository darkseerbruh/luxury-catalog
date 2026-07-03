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
    const keyWords = phrase.split(" ").length;
    for (let i = 0; i < caps.length; i++) {
      // A key can span 1..keyWords tokens (a single token may itself normalize to
      // several words, e.g. "on-pronged" -> "on pronged").
      let span = -1;
      for (let w = 1; w <= keyWords && i + w <= caps.length; w++) {
        const joined = caps.slice(i, i + w).map((t) => norm(t.text)).join(" ");
        if (joined === phrase) {
          span = w;
          break;
        }
      }
      if (span < 0) continue;
      const current = caps.slice(i, i + span).map((t) => t.text.trim()).join(" ");
      if (current === replacement) continue; // already correct; idempotent
      const lead = caps[i].text.startsWith(" ") ? " " : "";
      const from = caps[i].startMs;
      const to = caps[i + span - 1].endMs;
      const words = replacement.split(/\s+/);
      const per = (to - from) / words.length;
      const toks = words.map((w, k) => ({
        text: (k === 0 ? lead : " ") + w,
        startMs: Math.round(from + k * per),
        endMs: Math.round(from + (k + 1) * per),
        timestampMs: Math.round(from + (k + 0.5) * per),
        confidence: 1,
      }));
      caps.splice(i, span, ...toks);
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

// Building rank list: input/<base>.list.json lists rows (num + name) and the phrase
// that reveals each; times come from the transcript. Each name stays once revealed.
//   { "leftPct": 5, "topPct": 30, "rows": [
//     { "num": "4", "name": "Gucci Ophidia", "at": "fourth place" }, ... ] }
const resolveList = (base) => {
  const p = path.join(INPUT_DIR, `${base}.list.json`);
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
  const rows = cfg.rows.map((r) => {
    const t = find(r.at);
    if (t === null) console.log(`  list: phrase not found -> "${r.at}"`);
    return { num: r.num, name: r.name, revealSec: t ?? 0 };
  });
  console.log(`  list: ${rows.map((r) => `${r.num} ${r.name}@${r.revealSec.toFixed(1)}`).join(" | ")}`);
  return { rows, leftPct: cfg.leftPct, topPct: cfg.topPct, buildFromBottom: cfg.buildFromBottom };
};

// Static headline pinned at the top: input/<base>.headline.json
//   { "title": "LUXURY DIAPER BAGS, RANKED", "subtitle": "the 4 moms actually carry" }
const resolveHeadline = (base) => {
  const p = path.join(INPUT_DIR, `${base}.headline.json`);
  if (!existsSync(p)) return undefined;
  const cfg = JSON.parse(readFileSync(p, "utf8"));
  // Optional cta line under the headline, timed to when she says `ctaAt`.
  if (cfg.ctaAt) {
    const capsPath = path.join(PUBLIC_DIR, `${base}.json`);
    if (existsSync(capsPath)) {
      const caps = JSON.parse(readFileSync(capsPath, "utf8"));
      const firstWord = norm(cfg.ctaAt).split(" ")[0];
      const hit = caps.find((c) => norm(c.text).includes(firstWord));
      if (hit) {
        cfg.ctaSec = hit.startMs / 1000;
        console.log(`  headline cta: "${cfg.cta}" at ${cfg.ctaSec.toFixed(1)}s`);
      } else {
        console.log(`  headline cta: phrase not found -> "${cfg.ctaAt}"`);
      }
    }
  }
  return cfg;
};

// Remove non-speech tokens Whisper emits over dead air/ambience ("[BLANK_AUDIO]",
// "(birds chirping)", "[MUSIC]"...). They are not captions and they break dead-air
// trimming by making the caption window span the whole clip.
const cleanCaptions = (base) => {
  const capsPath = path.join(PUBLIC_DIR, `${base}.json`);
  if (!existsSync(capsPath)) return;
  const caps = JSON.parse(readFileSync(capsPath, "utf8"));
  const cleaned = caps.filter((c) => {
    const t = c.text.trim();
    return t && !/^[\[\(].*[\]\)]$/.test(t) && !/^[♪♫]+$/.test(t);
  });
  if (cleaned.length !== caps.length) {
    writeFileSync(capsPath, JSON.stringify(cleaned, null, 2));
    console.log(`  captions: dropped ${caps.length - cleaned.length} non-speech token(s)`);
  }
};

// Trim dead air at the head and tail using the caption word boundaries (silence
// detection is unreliable here because the audio has ambient/music). Trims the video
// and shifts caption times so everything downstream stays aligned.
const trimDeadAir = (base, publicVideo) => {
  const capsPath = path.join(PUBLIC_DIR, `${base}.json`);
  if (!existsSync(capsPath)) return;
  // The staged video is re-normalized fresh (untrimmed) every run, so trim from the
  // ORIGINAL (pre-trim) transcript: back it up on first trim, restore it after.
  const origPath = path.join(PUBLIC_DIR, `${base}.pretrim.json`);
  if (existsSync(origPath)) copyFileSync(origPath, capsPath);
  let caps = JSON.parse(readFileSync(capsPath, "utf8"));
  if (!caps.length) return;
  const vDur = Number(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", publicVideo],
      { encoding: "utf8" },
    ).trim(),
  );
  // REQUIREMENT (owner, 2026-07-03): the reel must OPEN on her first word, never on
  // dead air, and keep the (lip-synced) scratch audio. Whisper often mistimes the
  // FIRST token, padding the leading silence into it (start ~0.05s, low confidence),
  // which made the old start-of-first-word trim a no-op. Two guards, in order:
  //   1. Explicit per-clip override input/<base>.trim.json {"headSec":N,"tailSec":M}
  //      wins outright (use when auto-detection is uncertain; deterministic on re-run).
  //   2. Otherwise, if the first token looks silence-padded (low confidence AND a long
  //      span for one token), anchor the head on the reliable SECOND word instead.
  const overridePath = path.join(INPUT_DIR, `${base}.trim.json`);
  const override = existsSync(overridePath)
    ? JSON.parse(readFileSync(overridePath, "utf8"))
    : {};
  let headSec = caps[0].startMs / 1000 - 0.25;
  const firstPadded =
    (caps[0].confidence ?? 1) < 0.8 &&
    caps.length > 1 &&
    caps[0].endMs - caps[0].startMs > 350;
  if (firstPadded) {
    // keep ~0.35s of pre-roll before the second (reliable) word so the real first
    // word is never clipped, but drop the padded silence in front of it.
    headSec = Math.max(headSec, caps[1].startMs / 1000 - 0.35);
  }
  if (typeof override.headSec === "number") headSec = override.headSec;
  const start = Math.max(0, headSec);
  const tailSec =
    typeof override.tailSec === "number" ? override.tailSec : 0.4;
  const end = Math.min(vDur, caps[caps.length - 1].endMs / 1000 + tailSec);
  if (start < 0.15 && vDur - end < 0.3) return; // negligible dead air
  copyFileSync(capsPath, origPath); // keep the pre-trim transcript for re-runs
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });
  const tmp = path.join(TEMP_DIR, `${base}.trim.mp4`);
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-ss", start.toFixed(3), "-to", end.toFixed(3), "-i", publicVideo,
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", tmp, "-y"],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  copyFileSync(tmp, publicVideo);
  const sh = Math.round(start * 1000);
  const newDur = Math.round((end - start) * 1000);
  caps = caps
    .map((c) => ({
      text: c.text,
      startMs: c.startMs - sh,
      endMs: c.endMs - sh,
      timestampMs: (c.timestampMs ?? (c.startMs + c.endMs) / 2) - sh,
      confidence: c.confidence ?? 1,
    }))
    .filter((c) => c.endMs > 0 && c.startMs < newDur)
    .map((c) => ({ ...c, startMs: Math.max(0, c.startMs), endMs: Math.min(newDur, c.endMs) }));
  writeFileSync(capsPath, JSON.stringify(caps, null, 2));
  console.log(`  trim: cut ${start.toFixed(1)}s head + ${(vDur - end).toFixed(1)}s tail`);
};

// Auto-detect dollar amounts in the captions so they can pop on screen when spoken.
const detectDollars = (base) => {
  const capsPath = path.join(PUBLIC_DIR, `${base}.json`);
  if (!existsSync(capsPath)) return [];
  const caps = JSON.parse(readFileSync(capsPath, "utf8"));
  const out = [];
  for (let i = 0; i < caps.length; i++) {
    if (!/\$/.test(caps[i].text)) continue;
    let text = caps[i].text.trim();
    let j = i + 1;
    while (j < caps.length && /^[\d.,]+$/.test(caps[j].text.trim())) {
      text += caps[j].text.replace(/\s/g, "");
      j++;
    }
    const clean = text.replace(/[^$\d.,]/g, "");
    if (/\$\d/.test(clean)) out.push({ text: clean, atSec: caps[i].startMs / 1000 });
    i = j - 1;
  }
  if (out.length) {
    console.log(`  callouts: ${out.map((o) => `${o.text}@${o.atSec.toFixed(1)}`).join(", ")}`);
  }
  return out;
};

// Find where her SPEECH begins, skipping both the leading digital-silence pad the sync
// step prepends AND the room tone before she talks. The threshold must clear room tone
// (raw peak ~3000-5000) and land on real speech (~10000+); too low and it stops on room
// tone, leaving a silent-looking head that Whisper then hallucinates words onto. We set
// it relative to the clip's own speech level so soft and loud recordings both work.
const firstAudioOnsetSec = (video) => {
  const SR = 16000;
  const raw = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", video, "-ac", "1", "-ar", String(SR), "-f", "s16le", "-"],
    { maxBuffer: 1 << 30 },
  );
  const pcm = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
  const N = Math.floor(SR * 0.02); // 20ms frames
  const nf = Math.floor(pcm.length / N);
  // per-frame peak amplitude
  const peaks = new Float32Array(nf);
  for (let i = 0; i < nf; i++) {
    let mx = 0;
    for (let j = 0; j < N; j++) mx = Math.max(mx, Math.abs(pcm[i * N + j]));
    peaks[i] = mx;
  }
  // speech level = 85th percentile of non-trivial frames; threshold sits well above room tone.
  const loud = [...peaks].filter((p) => p > 1500).sort((a, b) => a - b);
  const speech = loud.length ? loud[Math.floor(loud.length * 0.85)] : 12000;
  const THR = Math.max(7000, speech * 0.4); // clears room tone, catches the first real word
  for (let i = 0; i < nf; i++) {
    let ok = true;
    for (let k = 0; k < 5 && i + k < nf; k++) {
      if (peaks[i + k] < THR) {
        ok = false;
        break;
      }
    }
    if (ok) return (i * N) / SR;
  }
  return 0;
};

// Trim the silent lead (and any pre-speech video) off the staged clip so Whisper never
// hallucinates on it and the reel opens on her first word. Overwrites publicVideo.
const trimLeadingSilence = (base, publicVideo) => {
  const overridePath = path.join(INPUT_DIR, `${base}.trim.json`);
  const override = existsSync(overridePath)
    ? JSON.parse(readFileSync(overridePath, "utf8"))
    : {};
  const onset =
    typeof override.headSec === "number"
      ? override.headSec
      : Math.max(0, firstAudioOnsetSec(publicVideo) - 0.12); // keep a hair of pre-roll
  if (onset < 0.25) return; // negligible lead
  const tmp = path.join(TEMP_DIR, `${base}.lead.mp4`);
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-ss", onset.toFixed(3), "-i", publicVideo,
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", tmp, "-y"],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  copyFileSync(tmp, publicVideo);
  console.log(`  lead trim: cut ${onset.toFixed(2)}s of dead air before first word`);
};

const processClip = async (fileName) => {
  const base = fileName.replace(VIDEO_RE, "");
  const inputPath = path.join(INPUT_DIR, fileName);
  const publicVideo = path.join(PUBLIC_DIR, fileName);
  const outPath = path.join(OUTPUT_DIR, `${base}.mp4`);

  console.log(`\n== ${fileName} ==`);

  // 1. Normalize to vertical 1080x1920 so captions, overlays, and hand tracking all
  //    share the same output coordinate space, and stage it for Remotion to serve.
  //    CRITICAL (bug fixed 2026-07-03): `npm run sync` leaves the clean audio delayed
  //    as a CONTAINER offset (audio stream start_time > 0), not real samples. Remotion
  //    honors that offset (plays leading silence), but the ffmpeg wav extraction used
  //    for Whisper ignores it (hears audio from 0). That mismatch timed every caption
  //    AHEAD of the voice by the sync delay. `aresample=async=1:first_pts=0` bakes the
  //    offset into real leading-silence samples (start_time -> 0) so transcription and
  //    render see the SAME audio and the captions line up with her voice.
  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-i", inputPath,
      "-vf",
      `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1`,
      "-af", "aresample=async=1:first_pts=0",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      publicVideo, "-y",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );

  // 1b. Trim the leading dead air BEFORE transcription (owner rule 2026-07-03:
  //     "start when I start talking"). `npm run sync` prepends silence to align the
  //     clean audio; if Whisper sees that silent lead it HALLUCINATES the first few
  //     words onto it (mistiming the head), and the reel opens on dead air. Trimming
  //     the silent lead first means Whisper only ever hears real speech, so captions
  //     are correct from word one and the video opens on her first word.
  //     Honors an optional input/<base>.trim.json {"headSec":N} to force the point
  //     (e.g. to drop an ad-libbed false start before the scripted open).
  trimLeadingSilence(base, publicVideo);

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

  // 2c. Drop non-speech tokens, then trim dead air at head/tail (shifting captions).
  cleanCaptions(base);
  trimDeadAir(base, publicVideo);

  // 3. Overlays: static (input/<base>.overlays.json) + speech-cued (<base>.cues.json).
  const overlays = [...loadOverlays(base), ...(await resolveCues(base, publicVideo))];

  // 4. Render.
  const rankTracker = resolveRanks(base);
  const rankList = resolveList(base);
  const headline = resolveHeadline(base);
  const callouts = detectDollars(base);
  const propsPath = path.join(TEMP_DIR, `${base}.props.json`);
  writeFileSync(
    propsPath,
    JSON.stringify({
      src: fileName,
      overlays,
      callouts,
      ...(rankTracker ? { rankTracker } : {}),
      ...(rankList ? { rankList } : {}),
      ...(headline ? { headline } : {}),
    }),
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
      "--timeout=180000", // survive heavy load (e.g. parallel renders on this machine)
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
