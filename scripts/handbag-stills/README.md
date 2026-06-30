# Handbag stills pipeline

Turns silent handbag videos into ranked, croppable product stills, then organizes
and labels them. Built to pull catalog/detail-page imagery out of iPhone clips.

**Important:** these stills are for the **bag detail page**, not for-sale listings.
No pricing or sellable framing. Treat any color you see as reference only
(lighting and screen shift it).

## Files

| File | What it does |
|---|---|
| `extract_products.py` | Video to product crops. Probes each clip, samples frames (fps=3 + scene changes), detects the dominant bag (YOLO), ranks by size + sharpness + centeredness, dedups (pHash), crops to the bag at native resolution, writes a per-clip contact sheet and a master `_index.csv` graded good / thumbnail / too-small. |
| `extract_clips.py` | Pull video **clips** (segments), not stills. `--ranges 3-7,12-18` cuts exact moments; `--scenes` auto-splits at scene changes; `--web` re-encodes muted + web-optimized (H.264, faststart) for detail-page loops. |
| `reorg.py` | Rebuilds `_by_bag/` folders from the manifest groups (primary -> detail -> thumb), plus `_by_bag/_index.txt`. |
| `build_guess_sheet.py` | Labeled montage of unnamed bags + a best-guess name and a confidence dot, for eyeballing guesses against the photo. |
| `collection-labels.csv` | **The manifest.** One row per kept still: file, brand, model, group, type (primary/detail/thumb/comparison), source, status, verify flags, notes. This is the durable catalog data. |

## Dependencies

```
brew install ffmpeg
python3 -m pip install --user ultralytics opencv-python-headless pillow numpy
```

## Run

```
python3 extract_products.py ~/Documents/handbag-products  /path/to/*.MOV /path/to/*.MP4
python3 reorg.py            # after labels are in the manifest
```

## Image storage

Source videos and the extracted JPEGs live **outside this repo** (e.g.
`~/Documents/handbag-products/`) so they don't bloat git. Only the scripts and the
manifest are versioned here. Output layout:

```
handbag-products/
  _clean/good/        standardized square product images (>=1000px source)
  _clean/thumbnails/  comparison-grade tiles
  _clean/_by_bag/     one folder per bag (primary + details), from reorg.py
  _clean/_removed/    cuts (reversible)
  collection-labels.csv
```

## How the manifest got its names

Hermès models/sizes/colors were resolved from three stacked evidence sources, not
guesses: the owner's Fashionphile cart (exact model + leather + size + color), her
Gmail Fashionphile alerts (Roulis, Halzan 31), and her own confirmations
(Constance 18/24, the 24/24, Picotin). A few owned non-Hermès names (some YSL,
Chanel) and several exact sizes remain owner-confirmable; they carry a `verify` flag
in the manifest.
