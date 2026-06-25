# Luxury Catalog — Handoff Document
*Updated 2026-06-25 (preference-governance + docs cleanup; recaps split to docs/handoff-archive.md). Current source of truth — read this first. Supersedes prior handoffs; carried-forward items (DNS, credentials, hero-research caveat) are preserved below.*

---

## 🧭 Active-lanes registry — the session router (READ FIRST)

**Lanes are durable; chats are disposable.** This project runs as a handful of parallel
**workstreams (lanes)**. You spin up a fresh chat whenever — each new chat does NOT need a long
pasted brief: it **hydrates from this table**, picks up a lane, and **writes its status back here
on wrap-up**. That is what stops chats running into each other: the table says what each lane is
mid-doing, so a cold chat sees what's in flight and picks up where the last one left off.

> **Lanes are a label for finding context, not territory — cross files freely.** Work blurs
> across lanes (a content post touches the DB and the CTA component); the "usually touches" column
> is a collision *hint*, not a fence. The only HARD limits: don't run two **live** chats on the
> same files at once (one worktree per concurrent chat), **announce any migration number**, and
> coordinate before restructuring a shared DB table — all per [parallel-sessions.md](parallel-sessions.md).

| Lane | Worktree · branch (off `main`) | Usually touches (not a fence) | Deep doc(s) | Live status → next action |
|---|---|---|---|---|
| **Content** (editorial suite) | `…/luxury-catalog-content` · `content/editorial` | `post` rows · `src/app/posts/**` · `docs/content-*.md` | [content-writing-handoff.md](content-writing-handoff.md) + [content-strategy.md](content-strategy.md) | Suite shape UNCONFIRMED (refined additive suite recommended). Chanel draft `post_id 1` FAILED factuality audit. 0 published. **Next:** confirm suite with owner → fix/rewrite Chanel as a decision piece → write the batch as drafts. |
| **Data / capture** | `…/luxury-catalog-data` · `data/market-capture` | `supabase/ingest/**` · `scripts/**` · `data/ingest/**` | [data-collection-handoff.md](data-collection-handoff.md) + [capture-runbook.md](capture-runbook.md) + [market-sweep-worklist.md](market-sweep-worklist.md) | Market sweep in progress (FP done; TRR/Vestiaire bulk transport is the bottleneck). Mid-tier (Coach via eBay/Poshmark) NOT captured. `promote-discovered` gated on a model-name normalizer. **Next:** merge `claude/multibrand-parser` → load Birkin 30 → mid-tier capture. |
| **UX / shop + auth-UX** | `…/luxury-catalog` (original) · `shop/listings` | `src/app/**` (NOT posts) · `src/components/**` · nav · `next.config.ts` · `docs/ux/**` · `docs/authentication-standard.md` | [authentication-standard.md](authentication-standard.md) + `docs/ux/**` | Nav restructure + the 3 auth-UX trims shipped (`6ff1372`: de-duped homepage Identify chip · gated+reframed `/closet` auth capture · PersonaRouter tile now standard-compliant). **Open:** Learn-vs-Check nav/homepage balance — proposal raised, awaiting owner pick. **PRIMARY NAV IS PROTECTED — never add to it without asking the owner.** |
| **Infra / ops** (catch-all) | any clean worktree · `ops/<task>` | `supabase/migrations/**` (announce the number!) · deploy/DNS · `docs/desktop-todo.md` · analytics | [desktop-todo.md](desktop-todo.md) + the setup checklist below | Migration apply-state = **RE-VERIFY** (see the pending-operator block below, do not trust). **Next (open to-do):** site-load / perf investigation, `desktop-todo.md` §J. |

**Starting a new chat — paste this (fill the lane), nothing longer is needed:**
> You're working the **`<LANE>`** lane of Luxury Catalog.
> 1. Sync `main` (or create your lane's worktree off `main` — see `docs/parallel-sessions.md`).
> 2. Read `docs/handoff.md` (the Active-lanes registry + your lane's row), then your lane's deep doc, then `docs/preferences.md`. Obey the ENFORCED block (auto-injected each turn).
> 3. Cross files freely as the task needs — just don't run a second **live** chat on the same files, announce any migration number, and coordinate shared-DB changes (see `parallel-sessions.md`).
> 4. On wrap-up: land on `main` with gates green (`tsc --noEmit`, `eslint src`, `next build`, `npm test`), then **update your lane's "Live status → next action" cell** in the registry.

*Keep each status cell to one current line (the live state + the single next action). Dated
session history goes in the TL;DRs below, then ages out to [handoff-archive.md](handoff-archive.md) — never let it pile up in the registry.*

---

## TL;DR — preference-governance system + docs cleanup (2026-06-25)

Goal of the session: make Claude's behavior match the owner's priorities without her re-reminding it. **No app code or DB touched** (docs + `.claude/` hooks only). All on `main`, commit `86c7fd8`.

- **Always-on rules = single source of truth.** The `ENFORCED:start..ENFORCED:end` block at the top of `docs/preferences.md` holds the 8 standing rules; `.claude/hooks/operating-rules.sh` (UserPromptSubmit) re-injects them **every turn**; `AGENTS.md` points at the block (no duplicate copy). To change an always-on rule, edit only that block. New this session: rule **#8 calibrated hedging** + the **Content factuality protocol** + a **Calibrated-hedge frames** list ("X, not Y").
- **The Preference Bar** (`AGENTS.md`): stored preferences must be short, decisive, clear, one decision per line, and **decisive about nuance** (prescribe the hedge, don't drop it). Wired into the wrap-up workflow; every added line must pass it.
- **Anti-bloat guard** `.claude/hooks/doc-budget.sh` (SessionStart): warns once per session if the ENFORCED block / `preferences.md` / `handoff.md` drift over budget or use hedge words in priorities. Budgets in the script; raise deliberately.
- **Docs cleanup:** `handoff.md` slimmed 698→233 lines (old recaps → `docs/handoff-archive.md`, nothing lost; pending operator items surfaced with a **re-verify** caveat). Added `docs/README.md` (the map: canonical vs archived). Archived 10 stale first-day/completed-handoff docs → `docs/archive/`. Removed a stale duplicate git worktree.
- **Activation:** hooks load at session start, so the per-turn injection + guard take effect in a **fresh session** (no action needed).
- **Open:** site-load/perf investigation (`docs/desktop-todo.md` §J) — the one new to-do; nothing is blocking.

## TL;DR — content development is the current unlock (2026-06-24)

**Why now:** the affiliate monetization stack is wired up (eBay EPN approved + links live in code; myGemma/Rebag/TLC/TRR/Fashionphile/MadAve applied — see `docs/data-collection-handoff.md` §11), but **Skimlinks REJECTED the site 2026-06-24** as "not suitable" — their criteria point to **insufficient original content** for a reviewer to determine the site's purpose/value. (NOT the fake-door/"coming soon" surfaces — those are fine and stay; owner confirmed real sites use them.) So the highest-leverage work shifts from *more signups* to **making the site content-rich + review-ready**, which also de-risks the pending manual-review approvals and is the real SEO/traffic engine.

**Content plan — lean on the two moats: real resale DATA + authentication authority. Prioritized pillars:**
1. ⭐ **Authentication guides** — "How to authenticate a Chanel Classic Flap / Birkin / Neverfull / Marmont." Brand-defining ("is it real"), high-intent SEO, obviously-original content, pure de-gatekeeping voice.
2. ⭐ **Value & price guides** — "[Bag] resale value & price history 2026", "Which Birkin sizes hold value best", "Is the Classic Flap worth it?" Built on OUR captured data (original/defensible), commerce-relevant (buy/sell links), feeds the value module.
3. **Buy/sell guides** — "Where to sell your [bag] for the most" (seller-side = top revenue lever), "Best entry luxury bags that hold value."
4. **Comparisons** — Neverfull vs Speedy, Classic Flap vs Reissue, Caviar vs Lambskin (high-intent, links both options).
5. **Market/trend** — most coveted now / what's appreciating / best deals under median (ties to `/coveted` + `/deals` + demand data; recurring).

**Data-readiness audit (run 2026-06-24, read-only against prod) — refines the plan:**
- price_history = **19,241 listing prices / 401 variants / 0 sold** (all "listing for"; owner confirmed asking-price framing is fine + we describe TODAY's market, not history).
- **Coverage is heavily HIGH-END:** LV 4,240/46 · Chanel 3,768/66 · Hermès 3,530/58 · Gucci 2,618/35 · Dior · YSL · Celine … **Coach only 200 rows/16 variants; Michael Kors / Kate Spade / Tory Burch / Longchamp = 0.** Cause: our only price sources (Fashionphile, TheRealReal) are **premium** resale — they barely carry mid-tier, so scraping them more won't fix it. (24k `discovered_listing` catch-all is premium-skewed too.)
- **Implication — split the strategy:**
  - **Value/market content → strong for high-end** (155 variants have 30+ listings). Write these on LV/Chanel/Hermès/Gucci now.
  - **Authentication wedge → mid-tier (Coach etc.)** per owner: lower stakes, more credible than pretending Chanel/Hermès auth expertise. Research + reference-image driven (does NOT need our price data) — can start now; needs detail images sourced first-party/licensed (NOT eBay — off-limits).
  - **Mid-tier VALUE content needs data we don't have → collect it first**, and from the RIGHT source: mid-tier bags live on **eBay + Poshmark**, not Fashionphile/TRR. Capture via the §5 Claude-in-Chrome method (data only; eBay images stay off-limits). Then mid-tier value content becomes credible.

**Recommended next:** (1) draft the **Coach authentication** article (credibility wedge, mid-tier); (2) start an **eBay/Poshmark mid-tier data capture** (Coach first) via Claude-in-Chrome to grow coverage; high-end value/market pieces can run anytime off existing data. Then **re-apply to Skimlinks**. All copy against `docs/voice-and-tone.md`. **Status: audit done 2026-06-24; owner choosing first action (Coach article / mid-tier capture / both).**

**Content-execution gap map (2026-06-24) — what content needs to actually earn + travel:**
- **EARN (keystone):** ⭐ **post→bag "money-moment" CTA block** — renders from a post's `topic_brand_id`/`topic_style_id`, surfaces seller-weighted buy/sell (later rent) affiliate links + a link to the bag page. **Articles are monetary dead-ends without it** (post body is plain text, no inline links; the affiliate money-moments live on the bag page). Plus **conversion instrumentation** (article→CTA→outbound click). Affiliate coverage to point at: eBay✅, myGemma/Rebag/TLC/TRR/FP pending, Skimlinks rejected (Vestiaire/1stDibs/RtR uncovered), Vivrelle pending.
- **PRODUCE:** article backlog (Chanel value ready; pick next 5–8); authentication **sourcing** (authoritative/cited — the real gap); **mid-tier data capture** (eBay/Poshmark, Coach first); **schematic SVG diagram component** (auth visual, decided not built).
- **TRAVEL:** internal linking (article↔bag↔/deals,/coveted,/quiz); **newsletter opt-in** (known unbuilt dependency); social repurpose per `social-content-calendar.md`; re-apply Skimlinks after content ships.
- **Critical path:** build the CTA block → push the Chanel value article through it end-to-end → then scale (backlog + diagram component + mid-tier capture + auth sourcing). Everything plugs into the CTA block. **Status: building the CTA block 2026-06-24.**

## TL;DR — real resale data + fidelity + parallel features (2026-06-23)

Two prior chats (value-module UI + data-collection pipeline) were reconciled and their stranded work landed; then a real data + feature push. **Companion briefs: `docs/data-collection-handoff.md` and `docs/archive/value-module-handoff.md` (both current).**

- **Listings now retire when they sell — live-vs-sold status (2026-06-24).** The Shop aggregates live marketplace listings but never dropped one once it sold/was pulled, so sold bags lingered forever and (with re-crawling) every re-sighting would inflate counts. New: **migration `0030`** adds `price_history.listing_status` ('available'|'sold') + `delisted_on`; the loader stamps new `listed` rows `available`; **`reconcile-sold.ts`** (`npm run reconcile:sold`) diffs a platform's fresh-crawl LIVE SNAPSHOT against what we show and marks the vanished ones sold. `getShopProducts`/`getListingsForVariant` now **dedup by `listing_ref` (keep latest observation)** and hide `sold`. **Why a snapshot, not DB dates:** the FP crawler's raw dump *accumulates* (preserves old captures), so a sold listing keeps re-loading with a fresh date — "newest date" can't tell live from sold; `fashionphile-crawl.ts` therefore also writes `data/ingest/_raw/fashionphile-live.json` (current run only, full-crawl only). **Safety:** reconcile aborts if the snapshot is empty or it would retire >50% of a platform's available listings (`--force` to override) — a partial crawl must not mass-retire. **Automation:** new scheduled GitHub Action `market-refresh.yml` (daily 06:00 UTC + manual) runs **crawl→reconcile** for Fashionphile (the only headless-crawlable source today; TRR/Vestiaire reconciled manually). **Scope deliberately = retire-sold only, NOT load:** bulk-loading the full 20k catalogue nightly via `--raw` flooded `discovered_listing` and tripped loader fragilities on messy records; loading new prices stays the existing manual curated pipeline. Reconcile treats listed rows with `listing_status` **null OR 'available'** as candidates (so the pre-0030 backlog reconciles too), excluding only 'sold'. **Loader hardening shipped alongside:** `normalizeDesigner` is null-safe and `fashionphile-crawl.ts` mkdir's the gitignored `_raw` dir before writing (it crashed in clean CI). **NOT YET DONE on prod:** (1) apply `0030` via the db-migrate Action — until then the Shop read returns empty (its select references the new columns), so apply 0030 with this deploy; (2) add `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as repo secrets for the Action.
- **Market-wide price capture started — "every bag" (2026-06-24).** New goal: price data for every bag on the secondary market (Fashionphile, TheRealReal, Vestiaire). **Phase 1 (Fashionphile) DONE:** new server-side master crawler `supabase/ingest/sources/fashionphile-crawl.ts` paginates `/collections/handbags/products.json` to exhaustion (polite pacing + 503 backoff) → raw dump 18,617 listings. New FP `--catch-all` adapter mode + new loader flag `load:prices --discovered-only` capture EVERY listing without force-matching: **7,477 curated → `price_history` (326 FP variants), 10,937 → `discovered_listing`.** Prod now: price_history 19,234 (FP 14,462 / TRR 4,729), discovered_listing 11,148. **Integrity rule locked:** catch-all rows go to `discovered_listing`, never auto-onto curated variants (`pickVariant` returns the first variant at score 0 → would stamp wrong prices). **Phase 2 (promote→curated) GATED:** `promote-discovered` currently yields junk clusters because the catch-all `style_guess` is the full FP title — needs a model-name normalizer before `--write`. **Phases 3–4 (TRR/Vestiaire) in progress:** browser capture validated (120 Chanel listings extracted), but bulk transport is the bottleneck (TRR CSP blocks the localhost sink; JS-return ~1KB cap; chunked `get_page_text` works but slow) + ~120-fetch rate limit → dedicated multi-session work. **Full resumable plan + per-brand loop: `docs/market-sweep-worklist.md`.**
- **TheRealReal resale data — full catalog loaded & verified (2026-06-24).** Prod holds the complete TRR resale set: **~225 distinct variants** carry `listed` rows (4,461 on the 2026-06-23 snapshot + the 116-row Chanel hero on 06-22 + 152 newly-surfaced listings on 06-24). All 165 size-variant targets adapt+load cleanly from the raw captures already in `data/ingest/_raw/` (no fresh browser capture needed to reload). **Fixed a real bug** in `supabase/ingest/sources/trr-jsonld.ts`: a captured record with no `name` crashed the whole adapt run (`name.toLowerCase()` on undefined) — now guarded, which also let ~152 previously-dropped listings through. **Cautionary note for whoever loads resale next:** the dedup index keys on `observed_on`, so re-adapting an *unchanged* raw file under a new date inserts near-duplicate rows that skew per-variant median/range. A 06-24 re-run did exactly that (4,063 exact dups); they were deleted by `price_id`, keeping only the 152 genuinely-new rows. Run a fresh capture+load only when you actually want a new-day snapshot. **When checking coverage, never trust an ad-hoc Supabase `select` count — it silently caps at 1000 rows; paginate with `.range()`.** See `docs/capture-runbook.md` (progress header refreshed).
- **Homepage UX rework shipped to prod (2026-06-23).** The "What brings you in?" section is now 6 value-SHOWING tiles (Is it real / Collect & invest / What's it worth / Find the bag for me / Best deals / Most coveted bags), search consolidated to a single hero input, plus a new "What the community knows" review-leaderboard section. New pages: **`/deals`** (listings under resale median) and **`/coveted`** (most-wanted bags by want-count). Tile 4 seeds `/quiz` with the first answer. All DB-backed pieces are resilient (graceful empty states until data/migrations exist). **Design + decisions: `docs/ux/homepage-experiments.md` + `docs/ux/review-data-leaderboards.md`.** Open items: structure `review.occasion` into an enum (unlocks night-out/work/travel boards); fix the `0012` axis vocab (drop `holds_value` — a price-data fact, not a vote) before applying; wire live top rows into the deals/coveted tiles. **Voice: em dashes now banned (`docs/voice-and-tone.md`); the tagline keeps its dash by exception.** **Migration `0027`** (clears variant 199's image so `/bag/199` shows the branded placeholder again) is on `main` but NOT yet applied — run the db-migrate Action to activate it.
- **Real resale data live** — captured **116 TheRealReal listings** for the Chanel Classic Flap Medium (variant 199) via Claude-in-Chrome (same-origin JSON-LD), parsed through the canonical `parseTrrDescription`, loaded to prod: fair-market range **$1,975–$11,000**, median $5,700, retention 87.7%, full per-listing colour/leather/hardware/year. Spec spread is real (Caviar/gold ~$7,200 vs Lambskin/silver ~$4,700).
- **True per-listing fidelity** — migrations **0024** (`listing_ref` in the dedup index) + **0025** (legacy backfill), applied to prod; loader writes `listing_ref ?? source_url`. Distinct same-price listings no longer collapse (94→116).
- **Three features shipped via parallel background agents** (worktree-isolated, then merged): per-listing dedup + **reusable `trr-jsonld.ts` adapter** (hero scaffolds), **resale-by-era lens** on the bag page, **Vestiaire + Fashionphile** parsers/adapters. 266 tests green.
- **Multi-brand parser** (branch `claude/multibrand-parser`, awaiting merge) — Hermès leathers/colours + `-Plated` hardware + LV/Gucci canvases; Birkin 30 coverage colour 5%→74%, material/hardware →100%. **Hermès Birkin 30 (102 rows) captured & ready to load** once merged.
- **`ANTHROPIC_API_KEY`** set in local `.env.local` (**rotate it**) — arms the condition-enrichment pass, which still needs `condition_detail` captured from TRR product pages (browser).

**Next:** merge `claude/multibrand-parser` → load Birkin 30 → capture remaining heroes (Kelly/Neverfull/Marmont) + condition_detail + first Vestiaire/Fashionphile dumps → run enrichment → era×condition matrix gets its condition axis.


---

## 📚 Archived session recaps → `docs/handoff-archive.md`

Past session-by-session recaps were moved to **`docs/handoff-archive.md`** on 2026-06-25 to keep this file lean. This file now holds: the current TL;DRs (above), the live setup checklist, and durable reference (accounts, constraints, key files, backlog). Read the archive for the build history of any shipped feature.

### ⚠️ Pending operator items surfaced from the archived recaps — RE-VERIFY, don't trust
The consolidated checklist further below predates these. The archived recaps flagged the following as "not yet applied / human-gated" **as of 2026-06-22/23**. Today is later and several were likely applied via the db-migrate Action since — so **treat this as a re-verify list, confirm applied-state in Supabase before acting, do not assume:**
- **Migrations flagged pending in recaps:** `0007` (taste/social), `0017` (auth-requests), `0018` (personalization P1), `0019` (personalization P2, + PostHog `personalized_home` flag), `0022`+`0023` (item-spec columns), `0027` (clear variant 199 image), `0030` (`listing_status` live-vs-sold). Also: repo secrets `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for the GitHub Actions.
- **Non-migration:** rotate the local `ANTHROPIC_API_KEY`; capture `condition_detail` (browser) + run the `enrich-specs --write` pass; the Phase-2 `promote-discovered` model-name normalizer; TRR/Vestiaire bulk-capture transport (see `docs/market-sweep-worklist.md`).
- **Launch-gated (also in `docs/desktop-todo.md`):** key rotation (A6), `/identify` make-real-or-fake-door (H6), DMCA agent before promoting UGC (G2).

## ⚙️ Human-gated setup checklist (nothing DB-backed works until these are done)

1. **Apply migrations** (Supabase SQL editor / CLI), in order:
   - `0001_init_schema.sql` (already applied previously)
   - `0002_user_features.sql` — profile, closet_item, watchlist, bag_request, thrift_find (+ RLS, new-user trigger)
   - `0003_reviews_notifications.sql` — review, notification (+ RLS)
   - `0004_resources_creators.sql` *(PR #2)* — creator + resource (embedded video reviews); public read / admin write
   - `0005_closet_status_want_have_had.sql` *(PR #2)* — closet_status enum → `want`/`have`/`had` (data-migrating; collapses researching/wishlist→want, owned→have)
   - `0006_social_expert_layer.sql` *(PR #2)* — extends `profile` (handle/social/trust flags), `closet_favorite`, `post`, `closet_stats` view
   - **`0007_taste_and_social_links.sql` *(engagement track — HUMAN-GATED, not yet applied)*** — adds `profile.social_links jsonb`, `profile.taste_vector jsonb`, `profile.taste_completeness int`; adds `closet_activity` + `photo_featured` values to the `notification_type` enum. **NOTE:** `ALTER TYPE … ADD VALUE` cannot run inside a transaction block in Postgres — if the migration tool wraps statements in a transaction, run the two `alter type` lines separately. Until this is applied, the new social/taste columns and the two new notification types don't exist; the app degrades gracefully (profile reads fall back, taste/recs return empty, follower notifications no-op).
   - **`0008_admin_flag.sql` *(security must-fix — HUMAN-GATED, not yet applied)*** — adds `profile.is_admin boolean not null default false` and revokes column-level UPDATE on `is_admin` + the 0006 trust flags from `anon`/`authenticated` (so they can't be self-granted via the row-level update policy). **After applying, the operator MUST set their own flag once via the Supabase SQL editor or they'll be locked out of `/admin`:** `update profile set is_admin = true where id = '<your-auth-user-uuid>';` The app guard (`requireAdmin()`/`isAdmin()` in `auth.ts`, enforced by `src/app/admin/layout.tsx`) **fails closed** — if the column is missing (pre-migration) or unreadable, admin access is DENIED, not crashed. (The photo-contributions migration that was sketched as `0008` will need a new number — now **`0011`**, since 0009/0010 are taken below.)
   - **`0009_corrections.sql` *(expert/corrections session — HUMAN-GATED, not yet applied)*** — adds the `correction` table for structured "suggest an edit" submissions. RLS: authenticated users INSERT + SELECT their own; admins (`profile.is_admin`) SELECT all + UPDATE status; public/anon cannot read. Depends on 0008 (`is_admin`). The app degrades gracefully if absent (submit fails with a clear message; admin queue shows empty).
   - **`0010_notification_prefs.sql` *(settings session — HUMAN-GATED, not yet applied)*** — adds `profile.notification_prefs jsonb default '{}'` (per-channel opt-outs; absent key = opted-in). Wired into the notification creators + price-alert cron via `isOptedIn()` (fails OPEN — notifications keep flowing if the column is missing). No new RLS policy needed (covered by the 0002 own-row update policy; privileged columns stay revoked by 0008).
   - **`0015_instagram_resources.sql` *(social-embed session — HUMAN-GATED, not yet applied)*** — extends the YouTube embed model (0004) to Instagram. Adds `'instagram'` to the `resource_type` enum + nullable cache columns (`embed_html`, `thumbnail_url`, `author_name`) on `resource`. **NOTE:** `ALTER TYPE … ADD VALUE` cannot run inside a transaction block — run separately if your tool wraps statements. App degrades gracefully if absent (the YouTube path is unchanged; Instagram rows just won't exist). *(Renumbered from `0012` → `0015` on 2026-06-22 to resolve a duplicate-`0012` collision with `0012_bag_axis_votes.sql`; it was never applied, so the rename is safe.)* See **`docs/social-embed-strategy.md`**.
   - **`0017_authentication_requests.sql` *(auth-marketplace v1 — HUMAN-GATED, not yet applied)*** — adds the `authentication_request` table (lead capture) + RLS (requester own; verified Authenticators read open queue + claims and may claim/close; admins read all). Depends on 0006 (`is_authenticator`) + 0008 (`is_admin`). **Money-free** — no Phase C obligations. After applying, grant `is_authenticator` to vetted pros so they see the queue. App degrades gracefully if absent.
   - **`0016_photo_contributions.sql` *(photo-contributions session — HUMAN-GATED, not yet applied)*** — adds the `bag_photo` table (+ RLS: public read published, insert-own-as-pending-and-attested, delete own, admin update), `profile.contribution_points` (client UPDATE revoked — anti-gaming), and a **public Storage bucket `bag-photos`** with storage RLS (public read; insert/delete own). Depends on 0008 (`is_admin`) + 0013 (`variant.image_url`, the hero a featured photo promotes into). No `ALTER TYPE` caveat (fresh enum). App degrades gracefully if absent (galleries empty; submit fails with a clear message; the admin queue + Most-Wanted board need `SUPABASE_SERVICE_ROLE_KEY`). **After applying:** grant `is_authenticator` (service role) to vetted contributors so their uploads auto-publish, and **register a DMCA agent before promoting UGC widely**.
2. **Run seed scripts** (need `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):
   ```
   npx tsx supabase/seed/seed-hero-styles.ts
   npx tsx supabase/seed/seed-breadth.ts
   npx tsx supabase/seed/seed-creators.ts   # video reviews → bag-page "Video reviews" (needs 0004 + hero styles first)
   ```
   All idempotent. The live DB still has the *old* seed data until these run.
   **Re-run `seed-hero-styles.ts`** after this session to apply the corrected
   Hermès blind-stamp / Chanel serial research (Task 4).
3. **Supabase email-confirm** — `/auth/confirm` now handles BOTH flows, so the **free tier works with the DEFAULT (unedited) template**: `signUp` passes `emailRedirectTo=${origin}/auth/confirm` and the route exchanges the `?code=` (PKCE) for a session. No template edit required to re-enable "Confirm email". *(Optional, custom template:* point it at `/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}` — that path still works too.)* Or disable confirmation while testing.
4. **PostHog**: set `NEXT_PUBLIC_POSTHOG_KEY` (+ optional `POSTHOG_KEY`); enable "Cookieless server hash mode"; optionally run `node scripts/setup-posthog.mjs`. **Add `.mcp.json` manually** (I don't auto-create startup config — snippet in `.env.example`/below).
5. **Price alerts**: set `CRON_SECRET` (Vercel injects it as the cron Authorization header); optional `RESEND_API_KEY` + verified sender for email. `vercel.json` already schedules the job daily.
6. **Affiliate**: sign up for programs; set `NEXT_PUBLIC_AFFILIATE_*` codes / `NEXT_PUBLIC_AFFILIATE_WRAP_TEMPLATE`.
6a. **GEO (PR #2)**: set `NEXT_PUBLIC_SITE_URL` (→ luxurycatalog.com when DNS is live; defaults to the vercel.app URL) and `NEXT_PUBLIC_AUTHOR_NAME` (your real name strengthens the E-E-A-T signal). After deploy, **submit `/sitemap.xml`** to Google Search Console + Bing Webmaster Tools (Bing powers ChatGPT search).
6b. **Curate video resources (PR #2)**: add `creator` rows for vetted reviewers + `resource` rows linking their best videos to styles (admin/seed) to light up the bag-page "Reviews & social" sections. **Instagram (social-embed session):** `creators.json` now also rosters Instagram creators (Je suis Lou, Redeluxe/Georgia, PurseBop, Handbag Holic). To turn Instagram embeds ON: apply `0012`, stand up a **Meta app with oEmbed Read + business verification**, set `META_OEMBED_TOKEN` (or `META_APP_ID`/`META_APP_SECRET`), secure **written permission** for featured partners, then add verified `resource_type:'instagram'` post rows (never-invent rule). Until the token exists, Instagram resources degrade to attribution link-outs. Full rationale + UX/legal: **`docs/social-embed-strategy.md`**.
7. **DNS go-live** (below) — still outstanding from day one.
8. **Smoke-test** the full auth + closet + watchlist + review + alert path against the live DB.

`.env.example` documents every variable.

---

## What's built (this session)

### Auth & accounts (`@supabase/ssr`, Next 16 Proxy)
- `src/lib/supabase/{server,client,admin}.ts` — cookie-aware server client, browser client, service-role admin client (server-only; admin dashboards & cron).
- `src/proxy.ts` — Next 16's renamed Middleware; refreshes the session per request (no-op without env).
- `src/lib/auth.ts` (`getCurrentUser`, `getProfile`), `auth-actions.ts` (signIn/signUp/signOut), `profile-actions.ts` (onboarding).
- Pages: `/login`, `/signup`, `/onboarding` (persona capture), `/profile`, route handler `/auth/confirm`. Header nav + home are auth-aware.

### Closet, watchlist, price alerts
- `collections.ts` + `collection-actions.ts`; `/closet` (grouped by status), `/watchlist` (target price + alert toggle). *(PR #2: closet statuses are now `want` / `have` / `had`.)*
- `BagActions` (save/watch) + `PriceTrend` (SVG sparkline) on bag pages.
- **Price-alert delivery**: `/api/cron/price-alerts` (CRON_SECRET-gated, service-role) scans watchlists vs price_history → in-app `notification` rows (deduped via `last_notified_at`) + optional Resend email + `price_alert_triggered` event. `/notifications` feed + header "Alerts" badge.

### Feedback loop (write side) + reviews
- `requestBag` (search dead-ends) + `logThriftFind` (`/found` + camera CTA); `/admin/requests` dashboard.
- **Reviews & ratings**: `review` table; reviews section + star `ReviewForm` on bag pages; aggregate average/count; one per user per variant; `review_submitted` event. *(PR #2: reviews are not closet-gated — review rented/borrowed/tried bags; post-review "add to closet?" prompt; `/profile/reviews` "My reviews".)*

### Affiliate "where to buy" (`affiliate.ts`, `WhereToBuy.tsx`)
- Resale search deep-links (Fashionphile / The RealReal / Vestiaire) on bag pages; optional affiliate codes + network wrapper from env; `outbound_resale_clicked` event.

### Analytics (PostHog, cookieless-first — ported from Lineage B)
- `src/lib/analytics/{config,events,posthog,server}.ts`; `providers.tsx`; `instrumentation-client.ts`; restyled `ConsentNotice`; `/ingest` reverse-proxy; weekly digest script + workflow.
- Instrumented: variant_viewed, price_history_viewed, search_performed/not_found, item_saved, feedback_submitted, review_submitted, bag_requested, thrift_find_logged, outbound_resale_clicked.

### Breadth seeding deepened
- Reseller CSVs now map into variant + production + fits rows; hero style names skipped; idempotent per style; brand allowlist generalized so the full Drive export auto-fills the 9 stub brands when dropped into `data/raw/`.

---

## Lineage fork (resolved)
Two parallel apps existed: **Lineage A** (this branch — full catalog app) and **Lineage B** (`luxury-catalog-analytics-plan-kiq8al` — a PostHog-instrumented prototype with a tier/silhouette filter home and Polène/Telfar/Longchamp seed). The user was running B locally and noticed "no search" — B never had it. **Decision: A is canonical; B's analytics were ported into A.** B can be archived; its alternate home/`/bags/[id]` pages were intentionally not brought over.

---

## Images — strategy decided
Full cited research in **`docs/image-strategy-research.md`**. Conclusions:
- **AI photoreal renders of real bags = NO** — not copyrightable (Thaler/Copyright Office) *and* still infringing (Hermès "MetaBirkins"), and violates the "never invent" rule.
- **Reference imagery must be real + rights-cleared**: first-party photos, **licensed affiliate-feed images (display + link-back)**, or **user-submitted (UGC license + DMCA)**.
- **Decorative/browse imagery** may be non-photoreal **silhouette illustration** (Fashionpedia model).
- **Sold-listing photos**: sometimes still reachable, but the affiliate license is tethered to a *live* listing+link — retaining sold photos re-creates copyright infringement. Own a **base layer** (UGC/first-party/CC) and treat live listings as a gap-filler.
- **Buying photos**: commission your own (you own them); stock (Getty/iStock/etc., mostly *editorial* license for branded bags); free CC/Unsplash/Wikimedia for hero items. **Trap:** buying scraped image datasets — the seller usually can't license rights it never held.

---

## ✅ BUILT: photo contributions + contributor tiers (2026-06-22)
*Now implemented — see the photo-contributions TL;DR at the top. Migration `0016` + Storage bucket +
service-role key are human-gated (checklist item below). The original spec is kept here for reference.*

*Designed with the user this session. Decisions locked: **hybrid moderation** (trusted users auto-publish, new users queued) and **all** engagement mechanics.*

### Mechanics
- **Rare-find empty state** on bag pages with no photo: *"This bag is a rare find! Have a photo of one in the wild? Submit it and yours might show up here."*
- **Contribution hooks** at moments users already have the bag/photo: closet-add ("add a photo"), thrift-find log, identify/camera tool (consent toggle), reviews ("show your bag").
- **Recognition / "good feels"**: photo **byline** ("Photo by @you"), a **featured hero** photo, **contributor badges/counts**, and a **"Most Wanted Photos"** board surfacing high-interest no-photo bags (reuse closet/search demand data).
- **Guardrail (auth product!):** ownership attestation + UGC license at upload; quality-gated rewards (accurate reference shots, not raw volume); DMCA agent + takedown; light moderation via `/admin/photos`.

### Contributor tier ladder (luxury-coded, expertise-ascending — names matter)
1. **Aficionado** — signed up.
2. **Collector** — built a closet / marked bags owned.
3. **Connoisseur** — contributing approved photos & knowledge.
4. **Authenticator** — verified, accurate, sustained contributions → **the "trusted" tier whose uploads auto-publish** (this IS the hybrid-moderation reward) + verified badge.
5. **Curator** — elite; shapes the catalog, featured, **first in line for the paid Authenticator Marketplace**, early access, comped premium.

**XP (quality-weighted, anti-gaming):** approved photos (rarer bag = more), high-clarity reference shots (stamp/hardware/date code), accepted corrections/feedback, reviews, closet breadth. Removals/flags cost points. Ownership attestation required.

**Why it serves strategy:** it's the **recruiting + credentialing pipeline for the Authenticator Marketplace** (revenue #2); the trusted tier **offloads moderation** so UGC scales; verified experts are a **trust moat vs PurseForum**; status + public closet drive **retention + virality**; quality-gating **protects data integrity**.

### Build sketch
- Migration `0007` (PR #2 took 0004–0006): `bag_photo` (variant_id, user_id, storage_path, caption, status [pending/approved/featured/rejected], owner_attested, created_at) + Supabase **Storage bucket** `bag-photos` + RLS (public read approved; insert/delete own); `profile` gains `tier` + `contribution_points` (or derive tier from points). *Note: PR #2 already added social/trust fields to `profile` (handle, `is_expert`/`is_authenticator`) — reconcile the contributor tier ladder with those.*
- Upload component (auth-gated, attestation + license), gallery w/ byline + featured hero, `/admin/photos` approve/feature queue, "Most Wanted" page, `photo_submitted` event.
- **Caveat:** file upload + Storage is the one piece that can't be runtime-tested here (no creds); bucket + migration are human-gated.

---

## Open backlog (after photo contributions)
- **Verification evidence beyond photos — multi-source listing capture *(idea, 2026-06-22; NOT now)*.** Let users submit, alongside owned photos, **links/URLs to live listings** as verification evidence: The RealReal, Vestiaire, eBay, **Facebook Marketplace**, and **private FB groups**. Public marketplaces = paste a URL (auto-parse where possible); **private groups have no public URL → give clear screenshot instructions** (what to capture so it's usable). Plus a **guided "right photos" flow**: one photo is never enough — walk the user through the specific shots that actually enable authentication (date code/stamp, hardware engravings, zipper pulls, heat stamp, interior tag, glazing, etc.), **modeled on the evidence requirements professional authenticators / authentication companies use** (e.g. Entrupy, Real Authentication, brand-specific checklists). Ties into the **Authentication Marketplace** + the photo-contributions system (a richer "submission" object: photos + listing links + structured shot checklist). Owner flagged as a future build, not a right-now to-do.
- **Social UI (PR #2 schema is ready)** — `/u/[handle]` public closet (Poshmark-style), "most coveted closets" leaderboard (`closet_stats`), expert blog gated behind `is_expert`, and a "Verified owner" badge on reviews (derive from `closet_item` have/had). Trust flags are admin-granted.
- **Authentication Marketplace** (Thumbtack model; revenue #2) — the tier ladder + `is_authenticator` profiles feed it. **Compliance spec: `docs/finance-compliance.md` Phase C** (Stripe Connect, never custody funds, 1099-K, marketplace sales tax, OFAC).
- **⭐ PRIORITY — connect real authenticators (supply side).** *(elevated 2026-06-25.)* The authentication strategy is a Learn → Check → Verify ladder, and the top rung (a human who authenticates an item mailed/photographed to them) is the honest endpoint we point every user toward. Today we have **no real authenticator relationships** — `/authenticate` is a coming-soon fake door and the marketplace has zero supply. Until this exists the ladder dead-ends and our liability promise ("we can't guarantee it, send it to a person") has nowhere to send people. **Action:** scope partnership/referral vs. in-house vetted contributors; candidate partners surfaced in research = established services (Real Authentication, Authentication First, Bagaholic, ReSee for Hermès/Chanel) and device-based (Entrupy) — a referral/affiliate deal with one is the fastest way to make the top rung real without building supply ourselves. *Metric: unlocks the paid Verify rung = direct authentication-marketplace revenue, and makes the whole free Learn/Check funnel credible.*
- **Premium tools / search-capability paywall** (Figma "Plan selector"; `monetization_interest` event exists, no UI). Catalog stays free. **Compliance spec: `docs/finance-compliance.md` Phase B** (PCI-via-Stripe, ROSCA + CA ARL auto-renewal, SaaS sales tax). **A Terms of Service page is required before the first payment.**
- **Collection-as-investment / insurance / tax premium feature** *(user-requested this session; unbuilt)* — value tracking + insurance-inventory export + cost-basis/tax records export. **Full design + cautions: `docs/finance-compliance.md` Phase D** (estimate-not-appraisal, insurance-by-referral-only, tax-records-not-advice, elevated data security).
- ~~**Affiliate-disclosure + price-data legal UX**~~ **DONE** (this session) — inline affiliate disclosure on `WhereToBuy`, footer disclaimer + legal links, "estimate not appraisal" on `PriceTrend`, and `/privacy` + `/disclosure` + `/disclaimer` pages. *Follow-up: real contact email; honor GPC in the live analytics flow.*
- ~~**Settings & account management** (edit email/password, notification prefs, delete account).~~ **DONE** (expert/corrections/settings session) — `/settings`. Human-gated: apply `0010` (notification_prefs); delete-account needs the service-role key.
- ~~**Expert blog gated behind `is_expert`**~~ **DONE** (same session) — `/posts` + `/posts/[slug]` (Article JSON-LD, named byline, related-catalog) + authoring under `/posts/new`, `/posts/[slug]/edit`, `/profile/posts`. Uses the existing 0006 `post` table (no migration).
- ~~**Admin auth gate** — `/admin/*` is still unauthenticated.~~ **DONE** (launch-hardening session): gated behind `profile.is_admin` via `requireAdmin()` + `src/app/admin/layout.tsx`, fail-closed. Human-gated: apply migration `0008` + self-set `is_admin` (see checklist item 1).
- **Brand depth** — 9 stub brands (drop full Drive CSV into `data/raw/`, re-run seeder) + browser-based hero-style research passes.
- ~~**Hero-research accuracy** — re-verify Hermès blind-stamp + Chanel serials.~~ **DONE** (expert/corrections/settings session) — system-level facts re-verified across multiple independent guides and raised medium→high with cited sources; per-year letter/series tables left unasserted (never-invent). **Re-run `seed-hero-styles.ts` to apply.**
- **RLS verification** — confirm a second user can't read another's closet/watchlist/notifications after 0002/0003 apply.
- **Analytics identity** — wire `identifyUser()`/`resetAnalytics()` on login/logout (Tier-2, consent-gated).

---

## DNS go-live (outstanding)
`luxurycatalog.com` registered at **Squarespace Domains**, points nowhere. Needs dashboard access (not doable from cloud).
1. **Vercel** → project → Domains → add `luxurycatalog.com` + `www`; note the A IP + CNAME shown.
2. **Squarespace** (domains.squarespace.com → DNS): delete existing `@` A + `www` CNAME; add A `@` → `76.76.21.21` *(verify vs Vercel)* and CNAME `www` → `cname.vercel-dns.com.`
3. Wait 15–60 min for "Valid Configuration" in Vercel.
4. Email forwarding: test `hello@luxurycatalog.com`; re-add MX `fwd1.squarespace.com.` (10) / `fwd2.squarespace.com.` (20) if wiped.

## Accounts & credentials
| Service | For | Where |
|---|---|---|
| Supabase | DB (`pewmdztviyrtbhtebcct`) | supabase.com |
| Vercel | Hosting (team `darkseerbruh`) | vercel.com |
| Anthropic | Camera tool + NL search + analytics digest | console.anthropic.com |
| PostHog | Analytics (set up this session) | posthog.com |
| Squarespace Domains | `luxurycatalog.com` DNS | domains.squarespace.com |

**`.mcp.json` to add manually (PostHog MCP):**
```json
{ "mcpServers": { "posthog": { "command": "npx", "args": ["-y","mcp-remote@latest","https://mcp.posthog.com/mcp","--header","Authorization:${POSTHOG_AUTH_HEADER}"], "env": { "POSTHOG_AUTH_HEADER": "Bearer ${POSTHOG_PERSONAL_API_KEY}" } } } }
```

---

## Non-negotiable constraints (product brief)
- **Never invent** authentication markers, date codes, serial formats, hardware details — leave `null` + `confidence_level: low` if unverifiable.
- **No invented imagery** — realistic photos must be *sourced* (licensed/UGC/first-party), never AI-generated for real bags. (Updates the old "no photos in v1" line: photos are now in scope via the sourced paths above.) *(PR #2: embedded YouTube reviews are the interim visual layer — embedding sidesteps the copyright issue entirely.)*
- **Catalog is always free** — paywall only on search *capability*, never content.
- **Coach must be in the catalog** — the viral thrift acquisition engine.
- **Mobile-first** — every page works at 375px.

## Key files
| Area | Files |
|---|---|
| Auth | `src/lib/supabase/*`, `src/proxy.ts`, `src/lib/auth*.ts`, `src/app/{login,signup,onboarding,profile,auth/confirm}` |
| Closet/watchlist/alerts | `src/lib/collections.ts`, `collection-actions.ts`, `notifications*.ts`, `email.ts`, `src/app/{closet,watchlist,notifications}`, `src/app/api/cron/price-alerts`, `vercel.json` |
| Reviews | `src/lib/reviews.ts` (`getMyReviews`), `review-actions.ts`, `src/app/bag/[variantId]/{Reviews,ReviewForm}.tsx`, `src/app/profile/reviews` |
| Affiliate | `src/lib/affiliate.ts`, `src/app/bag/[variantId]/WhereToBuy.tsx` (inline affiliate disclosure) |
| Legal/compliance UX *(this session)* | footer in `src/app/layout.tsx` (disclaimer line + legal links), `src/app/{privacy,disclosure,disclaimer}/page.tsx`, "estimate not appraisal" caption in `src/app/bag/[variantId]/PriceTrend.tsx` |
| GEO *(PR #2)* | `src/lib/geo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, JSON-LD + `generateMetadata` in `src/app/bag/[variantId]/page.tsx` |
| Video/creators *(PR #2)* | `src/lib/youtube.ts`, `getResourcesForStyle` in `queries.ts`, `src/app/bag/[variantId]/Resources.tsx` |
| Social/expert *(PR #2, schema)* | `supabase/migrations/0006_social_expert_layer.sql` |
| Analytics | `src/lib/analytics/*`, `src/app/providers.tsx`, `src/instrumentation-client.ts`, `scripts/*`, `.github/workflows/analytics-digest.yml` |
| Feedback/admin | `src/lib/actions.ts`, `src/app/admin/*` |
| Data | `supabase/migrations/000{1..6}_*.sql`, `supabase/seed/*` (incl. research `louis-vuitton-neverfull.json`, `gucci-gg-marmont.json`), `data/raw/*.csv` |
| Docs | `docs/handoff.md` (this), `docs/finance-compliance.md` *(this session — the money/legal spec for Phases A–D)*, `docs/marketing-plan.md` + `docs/archive/additive-features-port.md` *(PR #2)*, `docs/monetization-projections.md` (12-mo take-home model, re-run vs. updated UX/marketing), `docs/image-strategy-research.md`, `docs/product-brief.md`, `docs/archive/project-status.md` |
