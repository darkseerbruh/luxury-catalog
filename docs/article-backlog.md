# Article backlog + results ledger

*The article engine's queue and memory (`docs/article-engine.md` §2/§6).
Statuses: 💡 idea / ✅ ready / ✍️ drafted / 🔴 published / ⛔ dropped.
Score = demand evidence (date/n) × revenue proximity × effort. H/M/L composite.*

## Backlog

| title-idea | signal + evidence (date/n) | department | persona | lane | score | status |
|---|---|---|---|---|---|---|
| Chanel date-code decoder | search "chanel 25" ×5 (to 2026-07-02) + "Chanel in 2026" top-viewed ×2 (2026-07-06) + Chanel #2 brand 30d n=12; archivist dataset done | Authentication | Maya | 1 | H | 🔴 published 2026-07-08 (DB #36, /articles/chanel-date-code-decoder) |
| Hermès color codes decoded | Hermès #1 brand 30d n=15 + "Hermès authentication" top-viewed ×2 (2026-07-06) + "birkin" ×2; archivist dataset done | What it's worth | Sofia/Diane | 1 | H | 🔴 published 2026-07-08 (DB #37, /articles/hermes-color-codes) |
| Hermès leather guide (Togo/Clemence/Epsom/Swift) | same Hermès demand cluster (2026-07-07); split from the color-codes item; draft done in seasonal-archive/drafts | What it's worth | Sofia/Diane | 1 | H | ✅ ready (next run; ≤2/run cap hit this week) |
| Which houses actually name their colors | archivist slate 2026-06-28 (3-tier thesis, draft done); lower direct search demand, differentiated GEO | Comparisons | Maya | 1 | M | ✅ ready |
| LV Alma: what it is + what it costs on resale | search "alma" ×3 | What it's worth | Sofia | 1 | M | ✅ PUBLISHED 2026-07-10 (owner said "just post it") — post #38, slug louis-vuitton-alma-what-its-worth, topic→Alma(434), status=published. seed-alma-article.ts. Alma page (434) also got a real description + year 1934. Draft archived at docs/research-drafts/lv-alma-value-draft.md. Open: "Mini" size (n=130) is a market label not an official LV size — revise later if wanted (edit on-site; DB body is canon). |
| Which Hermès blue is which (8 blues decoded by code) | archivist pull 2026-07-15 (run 20): new coded-blue table in seasonal-archive/hermes.md §5c + dated blues §4 — Colvert 1P/Izmir 7W/Paon 7F/Electrique 7T/Atoll 3P/Encre M3/Zanzibar B3/Agate R2 + Saphir 73/France 71/Royale O8. Sub-cut of the published Hermès color-codes cluster (#37, Hermès #1 brand 30d n=15); pairs with #4 neutrals. Content-ideas #26. Caveat: §5c blues carry sourced name+code but NOT a sourced debut season (state code + "season not yet dated", never invent a year); codes are reseller-chart-sourced (medium) | What it's worth | Sofia/Diane | 1 | M | 💡 idea |

> **Cross-feed note (rule 3):** "goyard" is the only `search_not_found` on record
> (2026-06-28) and was also searched ×1 — a search-surface/data gap, not an article.
> Pointer added to `docs/data-content-worklist.md`. Goyard price data + an
> authentication article already exist, so this is a search-match gap to fix in the
> data loop, not new content demand.

## Results log

*Directional pre-launch reads (small n; PostHog `article_viewed` now firing, 8 all-time
to 2026-07-06). Not performance, readiness — real visitors are still previews/owner.*

- 2026-07-07 · Top-viewed published articles (all-time `article_viewed`, per-title):
  "Chanel in 2026, explained" n=2 and "Hermès authentication" n=2 lead, then the
  investment / red-flags / smaller-bag / Prada-auth pieces at n=1. Read as: Chanel +
  Hermès are the demand centers, which is exactly what this run's two drafts feed.
  GEO working — chatgpt.com is a top-3 referrer (n=3, 7d), the lead-channel bet showing
  early signal. n is tiny; this steers topic choice, it is not a verdict on any piece.
- 2026-07-08 · #36 chanel-date-code-decoder + #37 hermes-color-codes PUBLISHED LIVE
  (owner "do all your recs" go-ahead; via publish-articles.ts; both 200 on prod,
  bodies render as bullet beats). Now measurable — next run reads their entries /
  search-key arrivals / lane-1 CTA clicks per §6, and a winner spawns a social kit
  (cross-feed rule 2).
