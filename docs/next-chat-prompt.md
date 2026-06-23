# Next-chat bootstrap prompt

*Paste the block below into a fresh chat to continue the catalog data-pull work.
Keep this file updated at the end of each session (it's the "start here" pointer).*

---

Read `docs/catalog-backbone-handoff.md` first (sync `main` first: `git fetch origin && git checkout main && git pull`), plus `docs/preferences.md`. Then **run autonomously until the work is done — don't stop to ask questions or hand me manual steps.** My Mac is awake and Chrome is logged into TheRealReal, Fashionphile, and Vestiaire.

**Where we are:** prod has **~6,260 `listed` resale rows + 209 `discovered_listing`**. Last session (2026-06-23) did: **Gucci curated TRR** (Super-Mini-aware Dionysus + 1955-anchored Horsebit + Jackie/Marmont refresh — Super Mini stayed correctly separate), **7 Fashionphile next-icons** (Coco Handle, Lady Dior, Saddle, Jodie, Cassette, Peekaboo, Baguette — ~701 rows), and **Coach** curated per-model (Tabby/Pillow Tabby/Rogue/Brooklyn/Willow, ~200 rows). Variants #563–610. **TRR held at ~799 gentle fetches, 0 blocks.** Per-icon variant ids + recipe are in the handoff banner + §6/§7.

**Two efficiency wins (use them):**
- **Fashionphile needs NO browser** — `tsx supabase/ingest/sources/fashionphile-collection.ts <brand-slug> <token>` → `fashionphile.ts --raw` → `load:prices fashionphile --write`. Do this first for each icon. Validate require/exclude tokens against the live collection JSON before writing targets (inspect handle distributions — last session caught the Bottega `maxi-intrecciato` = WEAVE-not-size trap and the Chanel `extra-mini` ⊂ `mini` trap this way). Brand slugs: `chanel gucci celine saint-laurent louis-vuitton hermes christian-dior bottega-veneta fendi` (Dior is `christian-dior`). **Coach is NOT on Fashionphile** (empty collection) — Coach is TRR-only.
- **TheRealReal** via logged-in Chrome — gentle sequential ~450ms (`__fetchGentle`), fire-and-poll past the 45s tool timeout with an in-page `await setTimeout(…,40000)`. Use **localStorage as a cross-navigation accumulator** (`__xQueue`/`__xData`) so URL-gathering across several model searches + the fetch loop survive navigations and cooldowns; Blob-download `~/Downloads/<key>.json` once at the end → `cp` to `data/ingest/_raw/`. Search URL: `?keywords=<brand>&taxonomy[]=Handbags`; dedupe product links by trailing slug, exclude `/similar/`. **Use per-MODEL searches** (`gucci dionysus`, `coach tabby`) — they return dense, model-named results; the generic brand search returns mostly vintage/generic. The checkpoint-every-5 + break-on-403 fetcher means a partial block is always safe.

**Mission — all OPTIONAL polish now (the committed priorities are done):**
1. **Higher-fidelity TRR pass for the FP-only icons** (Coco Handle, Lady Dior, Saddle, Jodie, Cassette, Peekaboo, Baguette) and the 4 catch-all brands' icons (Constance, Chanel 19, Gabrielle, WOC, Sac de Jour, Kate) — adds **year + a 2nd source**. FP per-size data is already high-confidence, so this is polish. Use curated `trr-jsonld.ts` TARGETS (whole-word `modelSize`/custom predicates; share one `rawKey` per icon).
2. **More icons (Fashionphile-first):** e.g. Hermès Garden Party / Evelyne · Chanel Reissue 2.55 · Celine Belt Bag / Ava · YSL Niki / Le 5 à 7 · Bottega Andiamo / Arco · Fendi Peekaboo done → Fendi First / Sunshine · Prada (Galleria / Re-Edition) · Loewe (Puzzle / Hammock) · Dior Lady D-Joy. Recipe in §7: FP-first (no browser) → scaffold variants → add targets → optional gentle TRR → `load:prices --write` → `summary:refresh`.
3. **More Coach models:** Field/Bandit are thin on TRR; vintage Coach (Willis/Rambler/Station/City) is **model-LESS in TRR JSON-LD** (see handoff banner) → needs a non-TRR source. The hyped modern ones (Tabby/Rogue/Brooklyn) are done.

**Pre-authorized** (don't wait for approval): prod price-loads (`load:prices --write`, `summary:refresh`), variant scaffolding (`scaffold-variants.ts --write`), DB migrations via `gh workflow run db-migrate.yml` (merge to `main` BEFORE running it), and commit/merge your own green work to `main` (branch-per-batch; gate on `tsc`/`eslint`/`next build`/`npm test`).

**Owner-gated (prep/keep as dry-run, don't execute):** the Celine **#207 "Luggage" → #484** delete (`docs/celine-luggage-merge-plan.md`) and `promote:discovered --write` (cluster names need human curation first).

**Only stop if** Chrome has actually logged out of a site. Otherwise keep going, commit as you progress, and give me a running summary rather than questions.
