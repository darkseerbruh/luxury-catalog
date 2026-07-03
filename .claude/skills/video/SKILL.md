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
3. Captions are auto-generated, then auto-corrected for proper names (see below).

### Getting names right (super important)
Transcription mangles brand and French names. Two guards, in order of trust:
1. **Auto-lexicon**: `luxury-lexicon.json` fixes known mishears every run (Goyard,
   Saint Louis, Neverfull, OnTheGo, Hermès, Épi, Empreinte, her name, etc.). Add new
   ones there.
2. **Her script is truth**: for anything the lexicon cannot catch (a specific material,
   a price, an unusual name), get her actual script and add a per-clip
   `input/<clip>.corrections.json` (`{"heard phrase":"Correct Words"}`), or fix the word
   in `public/<clip>.json`. NEVER guess a French or proper term from the audio; ask her.
Always eyeball the finished captions for names before calling it done.

### Better audio: phone video + computer mic
If she films video on her phone but records audio on a computer mic (better sound),
combine them first. Both recordings just need to overlap in time; no clap needed.
```bash
npm run sync phone.mov mic.wav        # auto-aligns via the phone's scratch audio
npm run make phone.synced.mp4         # (or split first if multi-take)
```
`sync` cross-correlates the phone's own audio with the computer audio to find the
offset, then muxes the phone video with the clean audio in sync. Output is
`input/<name>.synced.mp4`. The match score is printed; if it is low (below ~0.5), the
two recordings may not overlap enough, so re-record with both running together.

### One recording, several takes
If she filmed multiple takes in a single video with a pause between each, split it first:
```bash
npm run split session.mp4          # cuts on the silent pauses
npm run make                       # renders every take
```
`split` cuts on silences (default: pauses of 1.2s+ below -30dB) into
`input/<name>_take01.mp4`, `_take02.mp4`, ... Takes under 1s are dropped. If it finds too
few, lower the pause threshold: `npm run split session.mp4 -30 0.8`. The one filming rule
is to leave a beat of silence between takes; takes that run together cannot be detected.

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

- `label` (optional): a name shown under the image (e.g. "Goyard Saint Louis").
- hold: by default the image stays up until the next cue (the whole time she talks
  about it). An explicit `"hold": <seconds>` pins a fixed duration instead.
- Keep bags OFF her face: place them upper-right (around `xPct` 80, `yPct` 24) unless
  following a hand.
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

### Ranking tracker (fills in as she counts down)
For a top-N ranking video, add `input/<clip>.ranks.json` to show chips that fill as
each place is revealed:
```json
{ "labels": ["4","3","2","1"],
  "fillAt": ["fourth place","third place","second place","the neverful"],
  "yPct": 11 }
```
Each label is a chip; it lights up gold when its `fillAt` phrase is spoken (resolved
from the transcript). Order the labels to match her reveal order. For a plain progress
counter instead of a rank countdown, use `["1","2","3","4"]`.

### Building rank list (numbers down the side, names stay)
For a countdown where each name should REMAIN on screen as she moves on, use
`input/<clip>.list.json` (numbers down one side, each name reveals and persists):
```json
{ "leftPct": 5, "topPct": 33, "rows": [
  { "num": "4", "name": "Gucci Ophidia", "at": "fourth place" },
  { "num": "3", "name": "LV OnTheGo", "at": "third place" } ] }
```
Order rows in reveal order. Add `"buildFromBottom": true` for a countdown so the
first-revealed sits at the bottom and the list fills UP toward number one at the top
(the owner's preference for ranked countdowns). Use this INSTEAD of the chip tracker;
keep the cued bag pics on the right so the pic is the current bag and the list is the
running tally.

### Headline (title pinned at top) — STANDARD, add to every video
Owner confirmed she wants a headline on every video. Add `input/<clip>.headline.json`
for a persistent title on a dark scrim:
```json
{ "title": "Luxury Diaper Bags, Ranked", "subtitle": "the 4 moms actually carry" }
```
Write it on-voice via `brand-voice`: descriptive and a little fun, says what the video is,
no em dashes. `title` is shown uppercase.

Add a timed CTA as its own big box (e.g. the site), separate from the headline scrim, with `cta` + `ctaAt` (the phrase
that reveals it, resolved from the transcript):
```json
{ "title": "...", "subtitle": "...", "cta": "luxurycatalog.com", "ctaAt": "luxurycatalog" }
```
The rank list auto-appears (all numbers at once) at the first revealed item, then names
populate as each is reached.

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

## Speed rules (READ THIS — renders are the expensive step)
A full 1080x1920 render is minutes per clip, so the goal is ONE correct render, not five.
- **Iterate in draft.** `npm run draft <clip>` renders at half resolution on all cores
  (~4x faster) for checking captions/timing/overlays. Do the final full-quality pass with
  `npm run make <clip>` only once it looks right.
- **Never re-render for a head-trim.** Trimming dead air or an ad-lib off the FRONT is an
  ffmpeg cut on the finished mp4 (seconds), not a re-render:
  `ffmpeg -ss <sec> -i output/<name>.mp4 -c:v libx264 -crf 18 -c:a aac out.mp4`. Only
  caption/overlay/headline CHANGES need a re-render. (For reproducibility, also record the
  point in `input/<base>.trim.json` so the pipeline reproduces it.)
- **One render at a time on this machine.** Parallel renders (e.g. another chat) contend
  for CPU and slow every one of them down.

## Step 4 — Verify before showing her
**Run `npm run verify <base>` first** (e.g. `npm run verify chanel1.synced`). In seconds,
with no watching, it checks the three things that have cost re-render cycles: audio is
present, the reel opens on her first word (no dead-air/room-tone head), and the burned
captions match the audio at three sample points (the sync-delay bug). Fix any FAIL before
looking further.

Then extract a few frames from `output/<name>.mp4` (`ffmpeg -ss <t> -i ... frame.png`) and
check: captions land on the right bag, the vertical crop keeps the subject, no competitor
branding on screen, no misspelled or wrong caption. Fix and re-render if not.

**Talking-head open + audio (owner rules 2026-07-03, canon `docs/script-requirements.md`
18-20):**
- **Opens on her first word, never dead air.** Extract the very first frame (`-ss 0.0`):
  her mouth should be engaged and the first caption already up. Whisper pads the leading
  silence into the first token, so the auto-trim can miss it. If the open is dead air, set
  `input/<base>.trim.json` `{"headSec": <seconds>}` (the point ~0.1s before her first word)
  and re-run `npm run make <clip>`, or front-trim the finished mp4
  (`ffmpeg -ss <headSec> -i in.mp4 -c:v libx264 -crf 18 -c:a aac out.mp4`).
- **Keep her voice audio.** A talking-head reel ships WITH her spoken track (a lip-synced
  scratch she overlays the trending sound against). Confirm the file has an audio stream
  (`ffprobe -select_streams a`). Never call a talking-head reel "silent by design" (that is
  montage-only).
- **Audio synced to her mouth** (within ~1 frame). The `sync` mux prints a match score; the
  phone's own audio is the ground truth for her lips.

## Step 5 — Name, store, log
- Rename the render to `output/<concept>-<YYYY-MM-DD>.mp4`.
- Append a row to `tools/video-pipeline/reels-log.md`: date, concept, mode, source clips,
  the caption/script, and status `draft`. Commit the log (not the video file).

## Step 6 — Deliver
Send the `.mp4` to Arielle for approval (SendUserFile). Do NOT post or schedule it yourself.
- **Talking-head:** ships WITH her voice (a lip-synced scratch track). Tell her she can
  overlay a trending sound in-app over it. Never label it silent.
- **Headless montage:** silent by design; tell her to add a trending sound in-app.

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
