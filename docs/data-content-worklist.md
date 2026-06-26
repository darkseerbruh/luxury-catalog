# Data + content worklist (live autonomous queue)

*The running queue for the "capture data, mine it, write articles" task. Per
`docs/preferences.md` rule 9 + the Autonomous run protocol: pick the top ⬜, do it, commit,
mark it ✅ with a one-line result, drop to the next. Never stop to summarize. A fresh chat
resumes from here. Method is documented in `docs/data-collection-handoff.md` §12 (get_page_text
transport; load-sold.ts; audit-coverage.ts) and `docs/research-drafts/poshmark-ebay-sold-capture.md`.*

Status key: ⬜ todo · 🔄 in progress · ✅ done (with result + date)

## Hero p2p SOLD capture (eBay completed sales → load-sold.ts → refresh-summary)
- ✅ Coach Tabby 20/26/Std + Rogue all sizes — 421 rows (2026-06-26)
- ✅ Chanel Classic Flap Medium v199 — 78 rows, median $3,846 (2026-06-26)
- ✅ LV Neverfull MM v218 — 87 rows, median $770 vs $1,245 ask (2026-06-26)
- ⬜ LV Speedy (capture asking too; not a curated variant yet — create style/variant first)
- ⬜ Hermès Birkin 30 v210 + Kelly 28 v214 (low eBay volume; verify enough genuine sold)
- ✅ Gucci GG Marmont small v207 sold — 46 rows, median $780 (2026-06-26)
- ✅ Dior Lady Dior Mini/Small/Med/Large sold — 46 rows (2026-06-26)
- ✅ Dior Saddle Medium/Mini sold — 88 rows, median ~$1,600 (2026-06-26)
- ⬜ Poshmark cross-source for Coach Tabby (corroborate the eBay $198 median)

## Mid-tier breadth (absent brands — create curated variants, then capture)
- ✅ Michael Kors created (brand 401, Jet Set style 514, v928/929); Jet Set tote sold — 80 rows, median $80 (2026-06-26)
- ✅ Kate Spade DONE: Knott (v925/926, 116 rows, med $120) + Sam (v927, 50 rows, med $100), eBay sold (2026-06-26)
- ✅ Longchamp created (brand 402, Le Pliage style 515, v930/931); nylon tote sold — 84 rows, median $99.50 (2026-06-26)
- ⬜ Mulberry (Bayswater/Alexa)

## Promotion / catalog
- ⬜ 28 promote-safe clusters that need NEW styles — owner greenlight before mass create
  (run `npx tsx supabase/ingest/promote-safe.ts --min=20` to list). Owner-gated.
- ⬜ Resolve the 1 ambiguous Neverfull "MM" duplicate (v868) across canvases (manual).

## Articles (write as DRAFTS, wire + chart + seed, gates green)
- ✅ #15 what-a-coach-tabby-actually-sells-for (CoachResaleRealityChart) (2026-06-26)
- ✅ #16 does-a-smaller-bag-cost-more (SizePriceCurveChart) (2026-06-26)
- ⬜ Neverfull vs Speedy (NeverfullSpeedyChart exists; needs Speedy data + the ask-vs-sold +
  Trends fading-icon angle). Coordinate with Content lane (owns that component).
- ⬜ "Most wanted vs most expensive" icon demand–price gap (Trends + our icon prices)
- ✅ "Dior Saddle is back" LIVE draft post (dior-saddle-resale-price), reuses ask-vs-sold-gap chart (2026-06-26)
- ✅ "The asking-price illusion" LIVE draft post #17 (AskVsSoldGapChart) (2026-06-26)

## Trends
- ✅ 7-set Google Trends pull recorded (`docs/research-drafts/trends-keyword-pull.md`) (2026-06-26)
