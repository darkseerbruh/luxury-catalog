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
- ✅ LV Speedy DONE (style 433: v497/498 + Bandoulière v934); 146 sold, median $593 (2026-06-26)
- ⛔ Hermès Birkin/Kelly eBay SKIPPED (deliberate): eBay is dominated by counterfeits/replicas/parts; genuine \$15k+ Hermès sells via specialist auction, not eBay. Loading eBay 'sold' would inject fake-priced noise onto hero variants (never-invent). Use a specialist source if ever needed.
- ✅ Gucci GG Marmont small v207 sold — 46 rows, median $780 (2026-06-26)
- ✅ Dior Lady Dior Mini/Small/Med/Large sold — 46 rows (2026-06-26)
- ✅ Dior Saddle Medium/Mini sold — 88 rows, median ~$1,600 (2026-06-26)
- 🔄 Coach other models: Brooklyn v606 sold loaded (169 rows, median $225). Remaining: Pillow Tabby v598/599, Willow v609/610.
- ⬜ Poshmark cross-source for other heroes (Neverfull, Flap) when desired
- ✅ Poshmark cross-source for Coach Tabby 26 — 24 recent sold, median $250 (vs eBay $198); both confirm ~$200-250, well under $365 ask (2026-06-26)

## Mid-tier breadth (absent brands — create curated variants, then capture)
- ✅ Michael Kors created (brand 401, Jet Set style 514, v928/929); Jet Set tote sold — 80 rows, median $80 (2026-06-26)
- ✅ Kate Spade DONE: Knott (v925/926, 116 rows, med $120) + Sam (v927, 50 rows, med $100), eBay sold (2026-06-26)
- ✅ Longchamp created (brand 402, Le Pliage style 515, v930/931); nylon tote sold — 84 rows, median $99.50 (2026-06-26)
- ✅ Mulberry created (brand 403, Bayswater 516/v932 + Alexa 517/v933); Bayswater sold — 93 rows, median $519, holds best of mid-tier (2026-06-26)

## Promotion / catalog
- ⬜ 28 promote-safe clusters that need NEW styles — owner greenlight before mass create
  (run `npx tsx supabase/ingest/promote-safe.ts --min=20` to list). Owner-gated.
- ⬜ Resolve the 1 ambiguous Neverfull "MM" duplicate (v868) across canvases (manual).

## Articles (write as DRAFTS, wire + chart + seed, gates green)
- ✅ #15 what-a-coach-tabby-actually-sells-for (CoachResaleRealityChart) (2026-06-26)
- ✅ #16 does-a-smaller-bag-cost-more (SizePriceCurveChart) (2026-06-26)
- ⬜ Neverfull vs Speedy (NeverfullSpeedyChart exists; needs Speedy data + the ask-vs-sold +
  Trends fading-icon angle). Coordinate with Content lane (owns that component).
- ✅ "Most searched vs most expensive" LIVE draft post #20 (SearchVsPriceChart): Kelly/Birkin top both; Flap least-searched yet 3rd priciest (2026-06-26)
- ✅ "Dior Saddle is back" LIVE draft post (dior-saddle-resale-price), reuses ask-vs-sold-gap chart (2026-06-26)
- ✅ "The asking-price illusion" LIVE draft post #17 (AskVsSoldGapChart) (2026-06-26)

## Trends
- ✅ 7-set Google Trends pull recorded (`docs/research-drafts/trends-keyword-pull.md`) (2026-06-26)

## Mid-tier insight (2026-06-26) — ready to wire as article
- ✅ Draft written: `midtier-holds-value-draft.md` (which accessible bags hold value). Leather heritage
  (Bayswater $519, Rogue $645) >> logo/nylon (MK Jet Set $70, Le Pliage $90, Kate Spade $100-114, Tabby $198).
- ✅ Wired midtier-holds-value as LIVE draft post #19 (MidTierHoldsValueChart), now under /articles route (Content lane renamed /posts→/articles) (2026-06-26)

## Speedy data (2026-06-26)
- ✅ LV Speedy created/used (style 433: 25=v497, 30=v498, +Bandoulière v934); sold 146 rows, median $593
  (25 ~$565, 30 ~$566, Bandoulière ~$840). KEY: Speedy out-searches Neverfull (Trends set 3) but SELLS for
  LESS ($593 vs Neverfull MM $770) — backs the Content lane's Neverfull-vs-Speedy piece (post_id 10).
