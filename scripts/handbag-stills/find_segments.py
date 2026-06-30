#!/usr/bin/env python3
"""
Find the parts of a handbag video worth pulling as clips.

Samples frames, scores each moment on bag presence + prominence + centeredness +
sharpness, then merges good moments into time ranges (gap-tolerant), drops short
or blurry stretches, and caps each proposal to a short detail-page-friendly window.

Output: a segments CSV (video, start, end, length, score, prominence, sharpness)
sorted best-first. Feed the ranges to extract_clips.py to actually cut them.

Usage: python3 find_segments.py OUT_CSV video1 [video2 ...]
"""
import os, sys, subprocess, tempfile, shutil, glob, csv
import cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract_products import MODEL, best_bag

FPS = 4               # sampling rate for analysis
PROM_MIN = 0.05       # bag must cover >=5% of frame to count as "good"
SHARP_FLOOR = 70.0    # Laplacian-variance floor on the bag crop (skip blur)
GAP = 0.6             # bridge dropouts up to this many seconds
MIN_CLIP = 1.2        # ignore good stretches shorter than this
MAX_CLIP = 8.0        # cap a proposal to its best MAX_CLIP-second window


def analyze(video):
    cdir = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", f"fps={FPS}", "-qscale:v", "3",
                    os.path.join(cdir, "f_%05d.jpg")],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    frames = sorted(glob.glob(os.path.join(cdir, "*.jpg")))
    samples = []  # (t, good, prominence, sharp)
    for i, fp in enumerate(frames):
        t = i / FPS
        img = cv2.imread(fp)
        if img is None:
            samples.append((t, False, 0, 0)); continue
        H, W = img.shape[:2]
        bag = best_bag(img)
        if not bag:
            samples.append((t, False, 0, 0)); continue
        x1, y1, x2, y2, conf = bag
        prom = ((x2 - x1) * (y2 - y1)) / float(W * H)
        cx1, cy1, cx2, cy2 = max(0, int(x1)), max(0, int(y1)), min(W, int(x2)), min(H, int(y2))
        region = img[cy1:cy2, cx1:cx2]
        sharp = float(cv2.Laplacian(cv2.cvtColor(region, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()) if region.size else 0
        good = prom >= PROM_MIN and sharp >= SHARP_FLOOR
        samples.append((t, good, prom, sharp))
    shutil.rmtree(cdir, ignore_errors=True)
    return samples


def runs(samples):
    out, cur = [], []
    last_t = None
    for t, good, prom, sharp in samples:
        if good:
            if cur and last_t is not None and (t - last_t) > GAP:
                out.append(cur); cur = []
            cur.append((t, prom, sharp)); last_t = t
        # a not-good frame doesn't break the run unless the next good is > GAP away
    if cur:
        out.append(cur)
    return out


def best_window(run):
    """Cap a run to its highest-scoring MAX_CLIP-second window."""
    if run[-1][0] - run[0][0] <= MAX_CLIP:
        chosen = run
    else:
        chosen, best = run, -1
        for i in range(len(run)):
            j = i
            while j < len(run) and run[j][0] - run[i][0] <= MAX_CLIP:
                j += 1
            win = run[i:j]
            m = sum(p for _, p, _ in win) / len(win)
            if m > best:
                best, chosen = m, win
    s, e = chosen[0][0], chosen[-1][0] + 1.0 / FPS
    mean_prom = sum(p for _, p, _ in chosen) / len(chosen)
    mean_sharp = sum(s2 for _, _, s2 in chosen) / len(chosen)
    return s, e, mean_prom, mean_sharp


def main():
    out_csv = sys.argv[1]
    videos = sys.argv[2:]
    rows = []
    for v in videos:
        name = os.path.splitext(os.path.basename(v))[0]
        for run in runs(analyze(v)):
            if run[-1][0] - run[0][0] < MIN_CLIP:
                continue
            s, e, mp, msh = best_window(run)
            if e - s < MIN_CLIP:
                continue
            score = mp * min(msh / 300.0, 1.0) * min((e - s) / MAX_CLIP, 1.0)
            rows.append([name, round(s, 1), round(e, 1), round(e - s, 1),
                         round(score, 4), round(mp, 3), int(msh)])
    rows.sort(key=lambda r: r[4], reverse=True)
    with open(out_csv, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["video", "start_s", "end_s", "length_s", "score", "prominence", "sharpness"])
        w.writerows(rows)
    print(f"{len(rows)} segment(s) across {len(videos)} video(s) -> {out_csv}")
    for r in rows[:12]:
        print(f"  {r[0]}  {r[1]:>5}-{r[2]:<5}s  len {r[3]:>4}s  score {r[4]:.3f}  prom {r[5]}")


if __name__ == "__main__":
    main()
