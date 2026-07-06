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

- `label` (the bag NAME, e.g. "Chanel 25"): shown on the card under the bag. **Owner rule
  (2026-07-04): every bag image must have its name on screen near it.** So set `label` on
  each card cue. The ONE exception: if the clip has a rank list (`<base>.list.json`) that
  already names each bag, the pipeline suppresses card labels so the name isn't doubled.
  A build-time `note:` warns if a card has no name and nothing else names it.
- **Price near the bag (owner rule 2026-07-04):** a spoken dollar amount auto-pops just
  under whichever card is on screen when she says it (`detectDollars`). For that to land,
  the card must still be up at the price, so DON'T pin a short `hold` on a card whose price
  comes later in her sentence. Leave `hold` off: the card auto-holds until the next bag
  (the whole time she talks about it), which covers the price.
- hold: by default the image stays up until the next cue. An explicit `"hold": <seconds>`
  pins a fixed duration (avoid it when a price for that bag is spoken later).
- Keep bags OFF her face: place them upper-left (around `xPct` 13, `yPct` 26).
- `card` (recommended): renders the cutout bag on a dark gold-edged panel so it pops off a
  busy background (her real bag wall). `cutout` (default true) makes the bag float as a
  shape (drop shadow, no panel); it blends into a busy wall, so prefer `card` there.
  `cutout:false` (no card) keeps the raw photo.
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

## Step 3c — Text-card mode (text-hook reels: one clip + text on screen)
For the "put a thought on screen over one held clip" format (her saved TikTok
style), use `scripts/montage-card.mjs`. Spec: `{ name, clip, start, duration,
caption, fontPx }`, or `blocks:[{text,fontPx,italic?,bullet?,hint?}]` for per-line
sizes / bulleted lists / a "(more in caption)" hint.
**Before rendering, read `docs/video-accessibility.md` (NON-NEGOTIABLE)** and
`docs/tiktok-swipe-file.md` §9 (copy + per-type rules). The look: one clip held (no
cuts), text on screen from frame 0 (no pop-in), Playfair serif (not the per-word
caption sweep), min text 46px (headline ≥56), a dark backing behind text + footer
(never shadow alone — cream-on-bright fails), brand footer lifted off the bottom.
**Keep her hooks verbatim.** Verify on the BRIGHTEST frame of the clip.

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
- **Opens on her first word, never dead air.** The pipeline auto-trims the silent lead
  before transcription, so this is usually handled. If she ad-libs a false start she wants
  cut (e.g. "a tale of two futures" before the scripted line), open on the real line with
  `input/<base>.trim.json` `{"startPhrase": "is the chanel 25"}` (matched on the transcript,
  timeline-independent, PREFERRED) and re-run `npm run make <clip>`. `{"headSec": N}` also
  works but is fragile (a raw second that drifts if the pipeline changes). `npm run verify`
  confirms the open.
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
Get the finished `.mp4` in front of Arielle for approval. Do NOT post or schedule it
yourself; delivery is for her to approve.
- Try `SendUserFile` if available. It is NOT always enabled ("not enabled in this context"
  on resumed/background sessions). If it errors, just give her the clickable local path(s)
  under `output/`; the files are on her own machine.
- **Talking-head:** ships WITH her voice (a lip-synced scratch track). Tell her she can
  overlay a trending sound in-app over it. Never label it silent.
- **Headless montage:** silent by design; tell her to add a trending sound in-app.

## Step 7 — Metricool draft handoff (only after she approves the reel)
Hand an approved reel to the social calendar as a Metricool DRAFT. Never publish or
schedule it live: draft only, posting stays her call. This whole flow is proven end to
end (2026-07-05, the 3 Chanel reels).

**Preflight — connector + brand (do not trust cached values):**
1. Metricool auth can lapse. If a call errors with an auth/authorization message, the
   Metricool connector needs a RECONNECT, which only she can do in an interactive session
   (claude.ai -> Settings -> Connectors -> Metricool -> Reconnect). Tell her that and stop;
   you cannot run the OAuth here.
2. Get the brand fresh with `getBrandSettings`. As of 2026-07-05: blogId `6480195`
   (`luxurycatalog_`), timezone `America/New_York`, connected networks TikTok, Instagram,
   Pinterest.

**Media host — the solved part (Metricool `media` needs a PUBLIC URL, the render is local):**
Metricool auto-ingests a public URL and rehosts the file on its own CDN
(`static.metricool.com/...`). The zero-setup public host is a temporary GitHub release on
the (public) `darkseerbruh/luxury-catalog` repo, driven with the already-authed `gh` CLI.
No token, no account, nothing for her to set up.
```bash
# 1. upload the approved reel(s) as release assets
gh release create reels-<tag> --repo darkseerbruh/luxury-catalog \
  --title "<...> (Metricool media host)" --notes "temp host; delete after drafts saved" \
  output/<name>.mp4
# 2. get the public download URL
gh release view reels-<tag> --repo darkseerbruh/luxury-catalog \
  --json assets --jq '.assets[].url'
```
The URL is `https://github.com/darkseerbruh/luxury-catalog/releases/download/<tag>/<name>.mp4`.
(Metricool also ingests a linked Google Drive/Dropbox URL if she has that source linked in
her Metricool account; the GitHub release is simpler because you can drive it yourself.)

**Create the draft** with `createScheduledPost`:
- `blogId`: `6480195` (or the value from preflight).
- `date`: a near-future placeholder (e.g. 3 days out, 6pm ET). It will NOT fire because
  it is a draft. Tell her it is a placeholder to reset when she reviews.
- `info.draft`: `true`. `info.autoPublish`: `false`. Both. This is what keeps it a draft.
- `info.providers`: `[{"network":"instagram"},{"network":"tiktok"}]`; `instagramData.type`
  = `REEL`.
- `info.media`: `["<the GitHub release URL>"]`.
- `info.text`: the caption (append the 4-6 hashtags). `info.tiktokData.title`: the hook.
- `info.tiktokData.privacyOption`: `SELF_ONLY` as a safety default; tell her to flip it to
  public in the draft when she is ready.
- Confirm the response shows `draft:true` and `media` rehosted to `static.metricool.com`.

**Cleanup + report:**
- Once every draft shows the `static.metricool.com` media, Metricool has its own copy, so
  DELETE the temp release to close the brand-image public exposure:
  `gh release delete reels-<tag> --repo darkseerbruh/luxury-catalog --cleanup-tag --yes`.
- Re-read with `getScheduledPosts` to confirm the drafts persisted.
- Give her the per-post planner links (`plannerUrl` in each create response) to review.
- Update the reel's row / add a note in `reels-log.md`: staged as Metricool draft with the
  post ids. Commit.

The caption/tag package (caption carrying the search key in plain text, TikTok title,
4-6 observed tags) is written per the POST PACKAGE rule in `docs/script-requirements.md`
(§17) and lives in the kit's `📋 CAPTIONS + TAGS` section.

## Look and feel
The caption style (cream text, gold on the spoken word, soft shadow, Poppins) lives in
`tools/video-pipeline/src/brand.ts`. Change it there to restyle every video. Keep it
luxury: restrained, legible, never the loud neon default.
