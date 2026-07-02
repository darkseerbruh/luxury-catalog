---
name: video
description: Make a short-form vertical video (reel) for Luxury Catalog from Arielle's own footage. Two modes: a talking-head clip with auto-captions, or a headless (faceless) montage of handbag b-roll with scripted captions. Runs the local Remotion + Whisper pipeline in tools/video-pipeline, applies the brand caption style, saves the render, and logs it. Use when she says make a video / reel / short / montage, caption a clip, or turn clips into a post.
---

# Video: make a captioned vertical reel

This runs the same way every chat so it does not depend on remembering how. The tool
lives at `tools/video-pipeline/`. Renders are large, so they stay local (never git);
the durable record is `tools/video-pipeline/reels-log.md`, which you always update.

Work top to bottom. Do not post anything. Delivery is a file for Arielle to approve.

## Step 0 — Orient
- `cd tools/video-pipeline`.
- If `node_modules/` is missing: `npm install`. The first render also downloads Whisper
  and a model (~150 MB) once. Both are one-time.

## Step 1 — Pick the mode
- **Talking-head**: she filmed herself (usually reading a script). Captions come from
  transcription. Use `scripts/make.mjs`.
- **Headless montage** (faceless): handbag b-roll with captions you script. Use
  `scripts/montage.mjs`. Her clips live in
  `~/Documents/handbag-products/_clean/_by_bag/<Bag>/` (45 clips, Hermes-heavy).

## Step 2 — Load the brand voice first
Before writing ANY caption or script, run the `brand-voice` skill. Captions are
user-facing copy: on-voice, descriptive not vibe-only, no em dashes.

## Step 3a — Talking-head mode
1. Put the clip(s) in `input/`.
2. `npm run make` (all clips) or `npm run make <clip.mp4>` (one).
3. Captions are auto-generated. Fix a wrong word by editing `public/<clip>.json`, then
   re-run `npm run make <clip>`.

### Speech-cued images (talking-head)
To pop a bag image into frame when she says a phrase, add `input/<clip>.cues.json`
and put the image in `input/`:
```json
[{ "say": "this hermes birkin", "img": "birkin.jpg", "hold": 2.8,
   "widthPct": 34, "tilt": -4, "follow": true, "cutout": true,
   "xPct": 64, "yPct": 50 }]
```
The pipeline finds the phrase in the transcript and pops the image in there (spring
in, hold, fade), timed to her words. `say` matches on normalized words, so ignore
case, punctuation, and accents. Re-run `npm run make <clip>` after editing cues;
transcription is cached so only the render repeats.

- `cutout` (default true): removes the image background so the bag floats as a shape,
  not a photo card. Best results come from a CLEAN single-bag still (no hands, plain
  background). Set `false` to keep it as a rounded photo card.
- `follow` (default false): the bag follows her hand. On first use it builds the Swift
  hand tracker (`native/handtrack.swift` -> `bin/handtrack`) via `swiftc`. Needs a
  visible hand in the shot. If no confident hand is found in the cue window, it falls
  back to the fixed `xPct`/`yPct`.
- `xPct`/`yPct` are the image center (used only when not following). Look at a frame to
  place it where her gesture lands.
- The clip is normalized to vertical 1080x1920 first, so best results come from footage
  she filmed vertically (which is native for TikTok anyway).

## Step 3b — Headless montage mode
1. Choose clips from `_by_bag/`. Prefer a TIGHT hero shot where the named bag is the
   clear subject. AVOID frames showing a competitor tag (the round "FASHIONPHILE" disc)
   or a wide table-of-bags "spread" shot.
2. Write a spec at `examples/<name>.json`:
   ```json
   { "name": "<name>", "zoom": 0.03, "segments": [
     { "clip": "/abs/path/clip.mp4", "start": 2.0, "duration": 2.2, "caption": "The Birkin" }
   ]}
   ```
3. Captions must be TRUTHFUL: bag names come from the folder labels, never invent specs,
   prices, materials, or years. Frame any value/authenticity language as estimate or
   markers, never a verdict (see the hedging frames in `docs/preferences.md`).
4. `node scripts/montage.mjs examples/<name>.json`.

## Step 4 — Verify before showing her
Extract a few frames from `output/<name>.mp4` (`ffmpeg -ss <t> -i ... frame.png`) and
check: captions land on the right bag, the vertical crop keeps the subject, no competitor
branding on screen, no misspelled or wrong caption. Fix and re-render if not.

## Step 5 — Name, store, log
- Rename the render to `output/<concept>-<YYYY-MM-DD>.mp4`.
- Append a row to `tools/video-pipeline/reels-log.md`: date, concept, mode, source clips,
  the caption/script, and status `draft`. Commit the log (not the video file).

## Step 6 — Deliver
Send the `.mp4` to Arielle for approval (SendUserFile). Say it is silent by design so she
adds a trending sound in-app. Do NOT post or schedule it yourself.

## Step 7 — Metricool draft handoff (only after she approves the reel)
Hand an approved reel to the social calendar as a Metricool DRAFT. Never publish or
schedule it live: draft only, posting stays her call.

1. Get the brand fresh with `getBrandSettings` (do not trust cached values). As of
   2026-07-01: blogId `6480195` (`luxurycatalog_`), timezone `America/New_York`,
   connected networks TikTok, Instagram, Pinterest.
2. Write the caption with the `brand-voice` skill: on-voice, a light CTA, no em dashes.
   Keep the TikTok title short.
3. Create the draft with `createScheduledPost`:
   - `blogId`: `6480195` (or the value from step 1).
   - `date`: the next slot from `getBestTimeToPostByNetwork`, or a near-future time. It
     will not fire because it is a draft.
   - `info.draft`: `true`. `info.autoPublish`: `false`.
   - `info.providers`: `[{"network":"tiktok"},{"network":"instagram"}]` (Reel format:
     `instagramData.type` = `REEL`).
   - `info.text`: the caption. `info.tiktokData.title`: the hook.
4. Media is the one manual step. `createScheduledPost` `media` accepts PUBLIC URLs only,
   and the render is a local file. So create the draft with the caption and settings,
   then tell her to open the Metricool draft and drag in `output/<name>.mp4`. Do NOT
   invent a URL. (Zero-touch upload is a future upgrade: host the render at a public URL,
   for example a Supabase Storage bucket, then pass that URL in `media`. That needs a
   bucket + key set up once, so it is her call to enable.)
5. Update the reel's row in `reels-log.md` status to `draft in Metricool`.

## Look and feel
The caption style (cream text, gold on the spoken word, soft shadow, Poppins) lives in
`tools/video-pipeline/src/brand.ts`. Change it there to restyle every video. Keep it
luxury: restrained, legible, never the loud neon default.
