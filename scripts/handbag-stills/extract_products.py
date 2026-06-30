#!/usr/bin/env python3
"""
Product-image extraction from silent handbag videos.

For each video:
  1. Probe res/fps/length (ffprobe). Flag short side < 1080 as "thumbnail only".
  2. Dense candidate pool: ffmpeg fps=3 sample + scene-change frames.
  3. Detect the dominant *subject* bag (YOLO COCO handbag/suitcase), weighting box
     area by centeredness so a held/centered bag beats a background object.
  4. Score candidates by bag size + crop sharpness + centeredness, dedup (pHash),
     keep the top ~10 distinct, auto-crop to the bag (+pad) at native resolution.
  5. Report each crop's pixel size + a pixelation flag; build a contact sheet and
     a master _index.csv sorted by best achievable crop size.

Deps:  brew install ffmpeg ; pip install --user ultralytics opencv-python-headless pillow numpy
Usage: python3 extract_products.py OUT_ROOT video1 video2 ...
"""
import os, sys, subprocess, json, tempfile, shutil, csv as _csv
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO

BAG_CLASSES = {"handbag", "suitcase"}      # 'backpack' dropped (bg false positives)
CONF = 0.30
KEEP_MAX = 10
SCENE_THRESH = 0.3
SAMPLE_FPS = 3
PHASH_DUP = 10
PAD_FRAC = 0.10
EDGE_FRAC = 0.015
GOOD_PX, OK_PX = 1000, 600
MODEL = YOLO("yolov8n.pt")


def run(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height,r_frame_rate",
             "-show_entries", "format=duration", "-of", "json", path])
    d = json.loads(r.stdout or "{}")
    st = (d.get("streams") or [{}])[0]
    w, h = int(st.get("width", 0)), int(st.get("height", 0))
    num, den = (st.get("r_frame_rate", "0/1").split("/") + ["1"])[:2]
    fps = (float(num) / float(den)) if float(den) else 0.0
    dur = float((d.get("format") or {}).get("duration", 0) or 0)
    return {"w": w, "h": h, "fps": round(fps, 2), "dur": dur,
            "thumbnail_only": (min(w, h) if w and h else 0) < 1080}


def candidates(path, cdir):
    run(["ffmpeg", "-y", "-i", path, "-vf", f"fps={SAMPLE_FPS}",
         "-qscale:v", "2", os.path.join(cdir, "s_%04d.jpg")])
    run(["ffmpeg", "-y", "-i", path, "-vf", f"select='gt(scene,{SCENE_THRESH})'",
         "-qscale:v", "2", "-vsync", "vfr", os.path.join(cdir, "c_%04d.jpg")])
    return sorted(os.path.join(cdir, f) for f in os.listdir(cdir)
                  if f.lower().endswith(".jpg"))


def phash(gray):
    s = cv2.resize(gray, (32, 32), interpolation=cv2.INTER_AREA)
    dct = cv2.dct(np.float32(s))[:8, :8]
    return (dct > np.median(dct[1:])).flatten()


def hamming(a, b):
    return int(np.count_nonzero(a != b))


def best_bag(img):
    """Dominant subject bag = max(area * centeredness-weight)."""
    H, W = img.shape[:2]
    diag = ((W / 2) ** 2 + (H / 2) ** 2) ** 0.5
    res = MODEL(img, verbose=False)[0]
    best, best_w = None, 0
    for b in res.boxes:
        if MODEL.names[int(b.cls)] not in BAG_CLASSES or float(b.conf) < CONF:
            continue
        x1, y1, x2, y2 = b.xyxy[0].tolist()
        area = (x2 - x1) * (y2 - y1)
        bcx, bcy = (x1 + x2) / 2, (y1 + y2) / 2
        centered = 1 - min(1.0, (((bcx - W / 2) ** 2 + (bcy - H / 2) ** 2) ** 0.5) / diag)
        weight = area * (0.35 + 0.65 * centered)
        if weight > best_w:
            best_w, best = weight, (x1, y1, x2, y2, float(b.conf))
    return best


def score_candidate(path):
    img = cv2.imread(path)
    if img is None:
        return None
    H, W = img.shape[:2]
    bag = best_bag(img)
    if bag is None:
        return None
    x1, y1, x2, y2, conf = bag
    short = min(x2 - x1, y2 - y1)
    cx1, cy1, cx2, cy2 = max(0, int(x1)), max(0, int(y1)), min(W, int(x2)), min(H, int(y2))
    region = img[cy1:cy2, cx1:cx2]
    if region.size == 0:
        return None
    sharp = float(cv2.Laplacian(cv2.cvtColor(region, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
    bcx, bcy = (x1 + x2) / 2, (y1 + y2) / 2
    cdist = ((bcx - W / 2) ** 2 + (bcy - H / 2) ** 2) ** 0.5
    centered = 1 - min(1.0, cdist / (((W / 2) ** 2 + (H / 2) ** 2) ** 0.5))
    edge = (x1 < EDGE_FRAC * W or y1 < EDGE_FRAC * H or
            x2 > (1 - EDGE_FRAC) * W or y2 > (1 - EDGE_FRAC) * H)
    return {"path": path, "img": img, "box": (x1, y1, x2, y2), "conf": conf,
            "short": short, "sharp": sharp, "centered": centered, "edge": edge,
            "hash": phash(cv2.cvtColor(region, cv2.COLOR_BGR2GRAY))}


def crop_to_bag(img, box):
    H, W = img.shape[:2]
    x1, y1, x2, y2 = box
    pad = PAD_FRAC * max(x2 - x1, y2 - y1)
    return img[max(0, int(y1 - pad)):min(H, int(y2 + pad)),
              max(0, int(x1 - pad)):min(W, int(x2 + pad))]


def pixel_flag(short):
    return "" if short >= GOOD_PX else "[small]" if short >= OK_PX else "[PIXELATED]"


def _font(sz):
    for fp in ["/System/Library/Fonts/Supplemental/Arial.ttf",
               "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, sz)
            except Exception:
                pass
    return ImageFont.load_default()


def contact_sheet(items, out_path, title):
    cols = 4 if len(items) > 4 else max(1, len(items))
    rows = (len(items) + cols - 1) // cols
    cw, lh, pad, th = 460, 30, 12, 40
    thumbs = []
    for p, label in items:
        im = Image.open(p).convert("RGB")
        im.thumbnail((cw, cw))
        thumbs.append((im, label))
    ch = max((t[0].height for t in thumbs), default=cw)
    W = cols * cw + (cols + 1) * pad
    Hh = th + rows * (ch + lh + pad) + pad
    sheet = Image.new("RGB", (W, Hh), (245, 245, 245))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 10), title, fill=(20, 20, 20), font=_font(22))
    for i, (im, label) in enumerate(thumbs):
        r, c = divmod(i, cols)
        x = pad + c * (cw + pad)
        y = th + r * (ch + lh + pad) + pad
        sheet.paste(im, (x + (cw - im.width) // 2, y))
        d.text((x, y + ch + 4), label, fill=(40, 40, 40), font=_font(14))
    sheet.save(out_path, quality=90)


def main():
    out_root = sys.argv[1]
    videos = sys.argv[2:]
    os.makedirs(out_root, exist_ok=True)
    summary = []
    for path in videos:
        name = os.path.splitext(os.path.basename(path))[0]
        meta = probe(path)
        out_dir = os.path.join(out_root, name)
        os.makedirs(out_dir, exist_ok=True)
        cdir = tempfile.mkdtemp(prefix=f"{name}_")
        kept_items, n_cand, n_bag, best_short = [], 0, 0, 0
        try:
            cands = candidates(path, cdir)
            n_cand = len(cands)
            scored = [s for s in (score_candidate(p) for p in cands) if s]
            n_bag = len(scored)
            if scored:
                smax = max(x["sharp"] for x in scored) or 1.0
                shmax = max(x["short"] for x in scored) or 1.0
                for x in scored:
                    x["score"] = (0.45 * x["short"] / shmax + 0.30 * x["sharp"] / smax
                                  + 0.15 * x["centered"] + 0.10 * x["conf"]
                                  - (0.20 if x["edge"] else 0))
                scored.sort(key=lambda x: x["score"], reverse=True)
                kept = []
                for x in scored:
                    if any(hamming(x["hash"], k["hash"]) <= PHASH_DUP for k in kept):
                        continue
                    kept.append(x)
                    if len(kept) >= KEEP_MAX:
                        break
                for i, x in enumerate(kept, 1):
                    crop = crop_to_bag(x["img"], x["box"])
                    chh, cww = crop.shape[:2]
                    best_short = max(best_short, min(chh, cww))
                    base = f"{name}_p{i:02d}_{cww}x{chh}"
                    cv2.imwrite(os.path.join(out_dir, base + "_crop.jpg"), crop,
                                [cv2.IMWRITE_JPEG_QUALITY, 95])
                    cv2.imwrite(os.path.join(out_dir, base + "_full.jpg"), x["img"],
                                [cv2.IMWRITE_JPEG_QUALITY, 95])
                    kept_items.append((os.path.join(out_dir, base + "_crop.jpg"),
                                       f"{base}_crop.jpg {pixel_flag(min(chh, cww))}".strip()))
            if kept_items:
                fl = "  [SOURCE <1080p]" if meta["thumbnail_only"] else ""
                contact_sheet(kept_items, os.path.join(out_dir, f"{name}_product_sheet.jpg"),
                              f"{name} product crops ({meta['w']}x{meta['h']}, {meta['dur']:.1f}s){fl}")
        finally:
            shutil.rmtree(cdir, ignore_errors=True)
        grade = "good" if best_short >= GOOD_PX else "thumbnail" if best_short >= OK_PX else "too-small"
        summary.append({"name": name, **meta, "candidates": n_cand, "frames_with_bag": n_bag,
                        "kept_crops": len(kept_items), "best_crop_short_px": best_short,
                        "product_grade": grade, "out_dir": out_dir})
    summary.sort(key=lambda s: s.get("best_crop_short_px", 0), reverse=True)
    with open(os.path.join(out_root, "_index.json"), "w") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(out_root, "_index.csv"), "w", newline="") as f:
        w = _csv.writer(f)
        w.writerow(["rank", "video", "src_w", "src_h", "length_s", "kept_crops",
                    "best_crop_short_px", "product_grade", "out_dir"])
        for i, s in enumerate(summary, 1):
            w.writerow([i, s["name"], s["w"], s["h"], round(s["dur"], 1), s["kept_crops"],
                        s["best_crop_short_px"], s["product_grade"], s["out_dir"]])
    grades = {}
    for s in summary:
        grades[s["product_grade"]] = grades.get(s["product_grade"], 0) + 1
    print(json.dumps({"videos": len(summary), "grades": grades}, indent=2))


if __name__ == "__main__":
    main()
