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
- ✅ Coach other models DONE: Brooklyn v606 (169, $225), Pillow Tabby v598/599 (83, $200), Willow v610 (54, $160), all eBay sold (2026-06-26)
- ⬜ Poshmark cross-source for other heroes (Neverfull, Flap) when desired
- ✅ Poshmark cross-source for Coach Tabby 26 — 24 recent sold, median $250 (vs eBay $198); both confirm ~$200-250, well under $365 ask (2026-06-26)

## Mid-tier breadth (absent brands — create curated variants, then capture)
- ✅ Michael Kors created (brand 401, Jet Set style 514, v928/929); Jet Set tote sold — 80 rows, median $80 (2026-06-26)
- ✅ Kate Spade DONE: Knott (v925/926, 116 rows, med $120) + Sam (v927, 50 rows, med $100), eBay sold (2026-06-26)
- ✅ Longchamp created (brand 402, Le Pliage style 515, v930/931); nylon tote sold — 84 rows, median $99.50 (2026-06-26)
- ✅ Mulberry created (brand 403, Bayswater 516/v932 + Alexa 517/v933); Bayswater sold — 93 rows, median $519, holds best of mid-tier (2026-06-26)

## New backbone brands (2026-06-28) — ONE-PASS capture (scaffold → all surfaces → load → summarize)

*Per the §0 capture standard: each new house's T1 styles need variants scaffolded FIRST
(loader drops zero-variant styles), then capture every source, load, refresh. Engines:
Fashionphile + Wayback = server fetch; TRR/Vestiaire/Rebag/etc = Firecrawl (bot-block
defeated, no Chrome session needed). eBay API + affiliate feeds dead (see §0a).*

> **🔬 Firecrawl probe (2026-06-30, in-session MCP, ~16 credits, Balenciaga City test) — UPDATES §0d:**
> - **Vestiaire = the cheap rich winner.** ONE search scrape = **5 credits** returns price + **colour +
>   material** + region per listing (data sits in the page; NO per-listing detail scrape needed). So a
>   whole-catalog Vestiaire pass ≈ 5 cr × ~56 styles ≈ **~280 credits — fits the FREE 1k tier**, even monthly.
> - **TheRealReal has HARDENED since 2026-06-28.** Search page still works (5 cr, price + title). But
>   **product/detail pages are now PerimeterX-captcha-blocked even on the stealth proxy** (403, still
>   burns 5 cr for nothing). The old ~2.85-cr/listing detail path is currently DEAD. TRR now gives only
>   price + material-from-title (no colour). Treat TRR as search-only + low priority until PX is solved.
> - **BLOCKER PROVEN (2026-06-30, $0 local dry-run): Vestiaire cannot be cleanly loaded per-variant.**
>   Search titles carry NO size (all null); the loader then piles EVERY size-less row onto the style's
>   first variant (tested: 13 mixed-size Antigona rows all landed on variant 1013 = Antigona **Mini**),
>   which would corrupt that variant's median. Size only exists on the Vestiaire DETAIL page as raw
>   DIMENSIONS ("12in x 10in x 6in"), needing fuzzy per-style dimension→label mapping to load cleanly.
> - **Verdict (my take): do NOT bulk-load Vestiaire per-variant.** Fashionphile already gives these
>   styles clean per-variant medians; the marginal lift (colour/material spread + region) doesn't beat
>   the dimension-mapping build + mis-size risk. **Better uses of Vestiaire:** (1) STYLE-LEVEL spread
>   stats for content (ad-hoc capture, cited in an article, no DB load) — e.g. "Antigona $198-$1,610
>   across colours on Vestiaire"; (2) single-variant styles only, where size-less rows are unambiguous.
> - TheRealReal detail stays PX-blocked. Net: the paid Firecrawl pass is NOT worth it right now; the
>   free Fashionphile per-variant medians stand as the clean dataset.

> **Method (2026-06-30, unattended Fashionphile pass):** `sources/fashionphile-collection.ts <slug>`
> server-fetches the brand's `products.json` (FREE, no Firecrawl credits) → `fashionphile.ts --raw`
> maps to TARGETS → `load:prices fashionphile --write` → `summary:refresh`. **Brand guard added to
> `mapRawRecord`** (matches a target only when the handle's brand == target brand) after a bug where
> loose substring tokens cross-matched (e.g. Valentino "rockstud-spike" → a Celine target). Sweep
> stray rows with `clean-fp-contamination.ts [--write]`. TRR/Vestiaire (Firecrawl, spends credits =
> owner-gated) + eBay sold (browser) remain per-brand ⬜ sub-items.

- 🔄 **Goyard** — ✅ Saint Louis PM/GM Fashionphile (refreshed 2026-06-30: PM med $2,462 n=258, GM med $2,495 n=117). ✅ Remaining styles 2026-06-30 (234 rows w/ Saint Louis refresh): Anjou Mini $2,930/n24 + PM, Artois MM $3,092/n12 + PM $2,945/n18, Belvédère PM $2,785/n19, Saïgon Mini $3,890/n11 + PM, Rouette PM, Bohème $2,995/n23. ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **The Row** — ✅ Soft Margaux 10/12/15/17 Fashionphile (refreshed 2026-06-30: med $4,495/$5,325/$6,445/$6,130, n=25/13/26/16). ✅ Remaining styles 2026-06-30 (59 rows): Margaux $6,455/n3, Half Moon $1,175/n3, Bindle $1,375/n1, Park Tote Medium $1,850/n9 + Large $1,950/n5 + Std $1,850/n7, Terrasse $4,045/n2. ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Balenciaga** — ✅ Fashionphile (2026-06-30, 111 rows): Le Cagole XS $1,072/n20 + Mini $695/n3, Hourglass XS $1,087/n20 + Small $1,150/n21, City(le-city) Small $2,220/n13 + Medium $2,605/n15, Neo Classic Nano $1,175/n6, Velo $1,130/n8, Papier $640/n3. ⬜ TRR/Vestiaire (Firecrawl, credits) + eBay sold (keys)
- 🔄 **Chloé** — ✅ Fashionphile (2026-06-30, 108 rows): Marcie Mini $650/Small $1,095/Medium $775, Faye Mini $460/Small $375/Medium $550, Woody Tote Medium $635/Large $1,010, Drew $505/n9, Aby Medium $1,017/n2, C Bag Mini $895/n1. Penelope=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Givenchy** — ✅ Fashionphile (2026-06-30, 115 rows): Antigona Mini $1,255/n35 + Small $1,015/n29 + Medium $1,050/n11, Pandora Mini $650/Small $485/Medium $450, 4G Small $830/Medium $1,150, Voyou Nano $750/Medium $800, Cut Out Mini/Small, GV3 $692/n2. ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Valentino** — ✅ Fashionphile (2026-06-30, 40 rows, slug `valentino-garavani`): Rockstud Spike Small $972/Medium $1,207/n8/Large $1,075, Roman Stud Small $1,420/Medium $1,392/Large $1,345, Locò Small $1,650/n7 + Standard $1,230, One Stud $660, VLogo Signature Mini $950, Supervee $1,142. (Vsling has no catalog style row — skipped.) ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Alexander McQueen** — ✅ Fashionphile (2026-06-30, 13 rows; thin feed n=37): The Knuckle $1,225/n4, The Bow Tote $620/n2, Skull $607/n6, Manta $1,800/n1. Jewelled Satchel=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Off-White** — ✅ Fashionphile (2026-06-30, 14 rows; tiny feed n=18): Binder Clip Mini $340/n9, Jitney $595/n5. Burrow=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Jacquemus** — ✅ Fashionphile (2026-06-30, 56 rows): Le Chiquito $495/n26, Le Bambino $650/n9, Le Grand Bambino $737/n16, Le Bambimou $760/n5. Le Chouchou=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Miu Miu** — ✅ Fashionphile (2026-06-30, 42 rows): Wander $2,000/n5, Arcadie $2,422/n6, Aventure $2,845/n11, Matelassé $667/n20 (excl. wander/arcadie/aventure handles). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Burberry** — ✅ Fashionphile (2026-06-30): Lola (Mini $570/Small $675 — refreshed), + remaining styles 39 rows: Banner Medium $730/n10 + Large $762, Note $1,060/n8, Title $995/n3, TB Bag Small/Medium, Pocket Mini $795. Catherine=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- ✅ **Mulberry** (existing mid-tier) — Fashionphile asking added 2026-06-30 (17 rows): Bayswater Small $1,095/n9 + Mini $1,020, Alexa Medium $555/Mini $945/Small (fills the empty Alexa style). Lily/Amberley/Antony have FP inventory but need NEW style rows (deferred — owner-gated like promote-newstyle).

> **✅ FREE Fashionphile pass COMPLETE (2026-06-30).** All 11 backbone brands + Goyard/The Row
> remainders + Mulberry captured: **856 rows / 81 new variants** in one autonomous run, 0
> contamination (brand guard added). Catalog 806→887 variants, 41,523→42,379 price rows. Merged to
> `main` (FF b7aab74→…). **Remaining per-brand ⬜ are PAID/gated:** TRR + Vestiaire need a Firecrawl
> credit budget (owner greenlight per §0c), eBay sold needs the browser session. Next free lever =
> a Redeluxe/Couture USA open-Shopify-feed adapter (registry §0b) for a second free asking surface.

**⬜ NEXT FREE UNIT — Redeluxe + Couture USA Shopify adapter (verified fetchable 2026-06-30):**
- Feeds (200, no key, no Firecrawl): `https://redeluxe.com/products.json?limit=250&page=N` and
  `https://www.coutureusa.com/products.json?limit=250&page=N`. Paginate like fashionphile-collection.ts.
- Shape: Redeluxe `vendor`=brand ("Hermes"/"Dior"/"CHANEL"), `product_type`="Handbag", `tags` carry
  condition ("excellent"), `title`=full descriptive name. Couture USA `vendor`=brand, structured tags
  (`CH-brand-<X>`, `Color_<X>`, `Condition <X>`, material words like "Damier Ebene").
- **SAFETY (do this, don't skip):** `load-prices` resolves brand→style with a FUZZY token-overlap
  `scoreStyleMatch` (accepts any score>0). A catalog-ABSENT style (e.g. LV "Beaubourg") can mis-land on
  a curated hero variant via a shared token (e.g. "Neverfull MM" via "mm"), corrupting a public median.
  So the adapter must either (a) map title→style with a curated per-brand allow-list (like the FP
  TARGETS), or (b) add a min-score threshold so weak matches route to `discovered_listing` not curated.
  Do NOT do a raw vendor-feed → curated load without one of those guards.
- Emit `platform:"Redeluxe"`/`"Couture USA"`, `price_type:"listed"`, `source_url` per listing, condition
  from tags. Then `load:prices <source> --write` → `summary:refresh` → run `clean-fp-contamination`-style
  brand check before trusting it.

## Promotion / catalog
- ✅ OWNER-GREENLIT 2026-06-26: promote-newstyle.ts created 16 new bag styles + 20 variants + 612 asking rows (Multi Pochette, GST, Chanel 25, Padlock, Camera Bag, Félicie, Graceful, Trendy CC, Noé, Trio, Loop, Artsy, Deauville, Sunset, Lady D-Lite, CarryAll); 8 apparel/junk clusters excluded by blocklist
  PLUS min=10 pass: +25 styles, +30 variants, +404 rows (Diane, Favorite, Boulogne, Delightful, Palermo, Tivoli, Reissue, Hop, Sylvie, Boston, Diorama, In-The-Loop, Jige, Trim, Jamie, Urban Spirit...). Strengthened blocklist excludes footwear/apparel/colour-soup. Total: 41 styles, 50 variants, ~1,016 rows.
- ⬜ Resolve the 1 ambiguous Neverfull "MM" duplicate (v868) across canvases (manual).

## Articles (write as DRAFTS, wire + chart + seed, gates green)
- ✅ #15 what-a-coach-tabby-actually-sells-for (CoachResaleRealityChart) (2026-06-26)
- ✅ #16 does-a-smaller-bag-cost-more (SizePriceCurveChart) (2026-06-26)
- ✅ Neverfull vs Speedy DONE (2026-06-27): wired as LIVE draft `neverfull-vs-speedy` via
  seed-neverfull-speedy.ts (LV/Neverfull-tagged so CTA renders). Angle = the reversal: Speedy
  out-searches Neverfull (Trends 27.8 vs 17.9; Neverfull fading 5y) AND lists higher (Speedy 30
  $1,623 vs MM $1,245) but SELLS for less (MM $770/n87 vs Speedy 30 $566/n93). NeverfullSpeedyChart
  rebuilt to the self-updating async ask-vs-sold pattern (getMedians on v218/v498, baked fallback).
  Gates green. Owner publishes.
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

## Monetization + freshness execution (owner-directed 2026-06-26)
- ✅ Skimlinks pre-resubmit: privacy policy now discloses affiliate/third-party tracking cookies (eBay/Impact/CJ/Awin/Skimlinks) — `src/app/privacy/page.tsx`. (Other blocker = PUBLISH drafts; reviewer sees only published.)
- ✅ Monetization gap fix: tagged #14 (Marmont vs Neverfull vs Speedy) → Gucci/Marmont so the PostBagCTA renders. (#11 rent-or-buy + #12 red-flags left brand-neutral by design.)
- ✅ UX BUILT: ShopThisBag (inline card injected after first chart + dismissible floating bar, mobile bottom / desktop bottom-right) pulling REAL live listings via getStyleShopData() (src/lib/article-shop.ts), affiliate-attributed. Data-led copy ("43 listed, from $130"), dismissible, 375px-safe. Gates green. Preview for owner to commit.
- ✅ FRESHNESS: runbook written (docs/freshness-runbook.md) — Fashionphile auto-daily; eBay/Poshmark/TRR browser-gated → MONTHLY re-capture cadence; real fix = affiliate product feeds (hands-off).
- ✅ MONTHLY RE-CAPTURE: durable trigger = .github/workflows/monthly-recapture-reminder.yml (1st of month → opens `recapture` GitHub issue; survives ephemeral container, unlike a 7-day session cron). Paste-ready loop prompt + bag list in docs/monthly-recapture-task.md. Capture stays browser-gated (Claude-in-Chrome), not CI (2026-06-26).
- 🔄 AFFILIATE GATE (confirmed 2026-06-25): Skimlinks REJECTED ("site not suitable at this time", generic). Root cause across ALL networks = thin PUBLISHED content + low traffic; articles sat as drafts so reviewers saw a near-empty site.
  - ✅ PUBLISHED 6 data articles 2026-06-27 (owner said "publish"): #15 what-a-coach-tabby-actually-sells-for, #16 does-a-smaller-bag-cost-more, #17 asking-price-vs-sold-price, #18 dior-saddle-resale-price, #19 which-accessible-bags-hold-value, #20 most-searched-vs-most-expensive-bags. Via publish-articles.ts + publish-articles.yml (CI holds the service-role key; this env has none). Slug-scoped, idempotent, reversible (UI unpublish). Picked the fresh, drift-clean set (NOT #6/#8/#9/#14). Log: "published 6/6". The other 11 drafts stay owner-gated.
  - ✅ PUBLISHED the remaining 11 drafts 2026-06-27 (owner said "push all unpublished live"): #4–#14 (where-to-sell, authenticate-LV, birkin-vs-kelly, fake-marmont, neverfull-mm-or-pm, iconic-resale-costs, neverfull-vs-speedy, rent-or-buy, resale-red-flags, good-investment, marmont-vs-neverfull-vs-speedy). Via publish-articles.yml write=true. Log: "published 11/11". ALL 17 articles now live. Owner ruled prices are a dated snapshot (page already shows the publish date in the byline) — the #6/#8/#9/#14 drift figures stay as-published, no refresh required.
  - ⬜ OWNER: reapply to Skimlinks + nudge Impact now that all 17 articles are live.
- ✅ LISTING FRESHNESS (owner: "listings sell every hour, monthly too long"): split medians (aggregate, monthly OK) from live listings (churn hourly). DID: (1) Fashionphile retire job daily→every 3h (headless); (2) ShopThisBag "view" links now rank reliable-live sources (Fashionphile→TRR) first so affiliate clicks avoid stale eBay/Poshmark rows. REAL hourly fix = affiliate product feeds (owner-gated on approvals); browser-gated eBay/Poshmark status can't refresh headless (2026-06-26).
- ✅ SELF-UPDATING CHARTS: all 6 data-article charts refactored to async server components reading live via getMedians() with per-field baked fallback (n=0/DB down never renders empty): CoachResaleRealityChart, AskVsSoldGapChart (Dior Saddle row stays baked — id 574/575 unresolved), SizePriceCurveChart, MidTierHoldsValueChart, SearchVsPriceChart (asking-only; Birkin/Kelly stay baked as cross-size aggregates; Trends bars static). Dior Saddle post reuses ask-vs-sold-gap. Gates green, pushed (2026-06-26).
- ✅ Drift check done → docs/article-freshness-report.md: #8/#9/#14 (Neverfull $1245→$1500, Marmont $911→$1095) + #6 (Birkin $18k→$19,995) STALE; Flap/Kelly/Tabby match. #10 can add Speedy sold $566. Owner updates figures before publishing those.

## "It bags of all time" canon gaps (for the ranked-canon article + tier-4; added 2026-06-29)
*These bags are in the archivist's top-20 canon but NOT in the catalog, so they can't carry a post→bag CTA in the "Why are these the it bags of all time?" article. Capture asking + sold across sources per §0, create the style/variant, load, refresh-summary.*
- ✅ **Balenciaga City** — DONE 2026-06-29. Created style City (variant 991); loaded 191 rows (eBay sold 76 + Fashionphile 115). Resale median ~$1,495 ($137–$2,965).
- ✅ **Mulberry Bayswater** — DONE 2026-06-29. Brand/style/variant already existed (variant 932); loaded eBay sold 112 + Fashionphile 15 → 220 total rows. Resale median ~$560 ($118–$1,468).
- ✅ **Telfar Shopping Bag** — DONE 2026-06-29. Created brand Telfar (tier thrift) + style Shopping Bag (variant 992); loaded 82 rows (eBay sold 45 + Fashionphile 37). Resale median ~$120 ($50–$330); eBay floor ~$81 is the accessible-market read, Fashionphile premium pulls the blend up.
- Loader: `supabase/ingest/load-canon-gaps.ts` (dry-run default, `--write`, idempotent). Captures were browser-gated (Claude-in-Chrome, owner-present); raw landed in gitignored `data/ingest/_raw/`. **NOTE:** migration 0038 added a FUNCTION `variant_price_summary()` that shares a name with the pre-existing 0021 materialized view of the same name — reconcile in the deals/hero RPC rewire (use one or the other).
- (also flagged separately, chip task_646da12f) ⬜ Backfill `price_history.condition` from source listings so the rail's "great price" verdict can become condition-aware (only 15 of ~31.8k listed rows have condition today).
