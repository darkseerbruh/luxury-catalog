# Luxury Catalog video pipeline

Raw phone clips go in, captioned + zoomed, ready-to-post vertical videos come out.
Runs fully on your Mac. No subscription, no API keys, no loud default styles.

It does the same job as apps like Submagic or CapCut, but the caption look is our
brand (cream text, gold on the spoken word) baked into code, so every video is
consistent and nothing has to be dialed back by hand.

## What it does to each clip
1. Crops to vertical 1080x1920.
2. Transcribes the audio locally (Whisper) and burns on word-by-word captions.
3. Adds a slow push-in zoom for movement and texture.
4. Optionally drops product images/b-roll on top at times you choose.

## One-time setup
```bash
cd tools/video-pipeline
npm install
```
The first `npm run make` also downloads Whisper and a speech model (~150 MB) once.

## Everyday use
```bash
# 1. Drop your filmed clips into  input/
# 2. Run:
npm run make            # processes every clip in input/
npm run make clip.mp4   # or just one
# 3. Finished videos land in  output/
```

Preview and fine-tune the look live:
```bash
npm run studio
```

## Put images on a clip (optional)
Drop `input/<clipname>.overlays.json` next to the clip, and put the images in `input/` too:
```json
[
  { "img": "birkin.png", "fromSec": 1.5, "toSec": 4.0, "xPct": 50, "yPct": 30, "widthPct": 46 }
]
```
`xPct` / `yPct` are the image center (0-100). `widthPct` is width as a share of the frame.

## Change the look
Everything visual lives in [`src/brand.ts`](src/brand.ts): colors, font size, caption
position, zoom strength, uppercase on/off. Change one file, restyle every video.

## Filming tip
Film while reading your script from a teleprompter (CapCut has one built in, or any
teleprompter app). Clear audio makes the captions near-perfect. Batch several clips in
one sitting, then run `npm run make` once.

## Notes on accuracy and speed
- Default model is `base.en` (fast, good for clear talking-head audio). For higher
  accuracy switch `WHISPER_MODEL` to `medium.en` in [`config.mjs`](config.mjs).
- Captions are generated, so glance through `output/` before posting. Fix a wrong word
  by editing `public/<clip>.json` and re-running `npm run make <clip>`.
