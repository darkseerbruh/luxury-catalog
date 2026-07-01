# TikTok trending-terms → Notion pipeline

Turns a screen-recording of the TikTok Creative Center **"Saved"** keyword list into
rows in the **Notion** database *TikTok Trending Terms* (under "Luxury Catalog · Social
Command Center"). **Notion is the master** for this data (decided 2026-07-01). There is
no Supabase copy and no committed CSV any more; both were retired to stop drift.

TikTok's Saved list is a logged-in, personalized view with **no API**, so step 1 is always
the owner recording it by hand. Everything after is scripted.

## Flow

1. **Record** the Saved list (owner, on phone) and hand over the `.mp4`.
2. **Frames:** `ffmpeg -i rec.mp4 -vf "fps=2,scale=590:-1" -q:v 3 frames/frame_%03d.jpg`
3. **OCR:** compile once with `swiftc ocr.swift -o ocr`, then
   `for f in frames/*.jpg; do echo "===== $f ====="; ./ocr "$f"; done > ocr_all.txt`
   (macOS Vision; prints `y<TAB>text` per line, top-to-bottom.)
4. **Parse:** `python3 parse.py` reads `ocr_all.txt`, associates each term with the number
   in its row band, writes `parsed3.json`.
5. **Clean:** `python3 clean.py` reads `parsed3.json` → OCR fixes, fuzzy-dedupe, brand tag,
   saturation-priority score → `clean.json`.
6. **Upsert to Notion:** a Claude session with the Notion connector reads `clean.json` and
   creates/updates pages in the *TikTok Trending Terms* data source. Match on **Term**;
   write only the machine columns (Popularity, Pop #, Growth, Brand, Suggested content,
   Priority) so the owner-edited **Creators / saturation** and **Status** are preserved.

## Why no standalone Notion script?
The Notion connection is the session-scoped MCP connector, not a repo token, so the upsert
runs inside a Claude session, not a cron job. Hand a new recording to a chat and ask it to
refresh the Notion trends database.
