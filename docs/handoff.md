# Luxury Catalog — Handoff Document
*Updated 2026-06-22. Current source of truth — read this first. Supersedes prior handoffs; carried-forward items (DNS, credentials, hero-research caveat) are preserved below.*

## TL;DR — adaptive value module (M0–M2) on the bag page (2026-06-22)

Reworked the bag page's "What it's worth" block into an **adaptive value module**, synthesizing inspiration from Google Shopping (merchant rows + "best price"), KBB (good/great grade), and Google Flights (timing verdict, best-vs-cheapest, flex grid). All `tsc`/`eslint`/`next build`/`199 tests` green.

**Architecture decision:** every complex price viz is *one primitive* — `CompScale` (`src/app/bag/[variantId]/CompScale.tsx`): comps on a shared price axis, optionally grouped into rows. Gauge = ungrouped; condition ladder = grouped by tier; year lens / flex grid = later groupings. The `ValueModule` (`ValueModule.tsx`) is one skeleton reframed by closet state (want/have/had → buyer/owner/collector); only headline/verdict/CTA change. Fires `value_module_viewed` (framing + comp counts + demand level) so usage data — not a guess — picks which user type is most common/monetizable.

**Shipped (all from data we already have — no migration):**
- **M0** — `CompScale` gauge + adaptive `ValueModule` + instrumentation. *On `main` (merge `732f59c`).*
- **M1** — demand signal (`getVariantDemand`, wants/watchers) + retail-hike catalyst (`retailChange`) → a descriptive, framing-aware **timing note** ("waiting hasn't paid off lately"). Never advice.
- **M2** — **condition ladder**: groups recorded resale into the canonical `sale_condition` tiers (already enum-typed at the DB; eBay already normalizes via `normalizeEbayCondition`), grading *within* tier so a cheaper-but-worn bag can't masquerade as a deal. Shows when ≥2 tiers have data, else falls back to the gauge.
- **Year (era context)** — a `Vintage`/`Discontinued` chip + a neutral note in the module, from the variant's `year_start/year_end`. This is the *honest* year signal we have today: per-listing era (the era×condition matrix) is **deferred** because no resale feed carries a reliable item year — `price_history.production_year` (migration `0022`) exists but no adapter populates it. The matrix activates once the LLM date-code extraction pass lands (`CompScale` already supports the grouping).

**Honesty rails (locked):** every number is a real recorded price; copy is descriptive + dated, never an appraisal/advice; degrades to "no recorded resale data yet" when empty. Thin-data posture chosen = **broaden scope, clearly labeled** (the scope chip is in place; cross-variant broadening is a later data step).

**Caveats:** listing dots only render where `price_type='listed'` rows exist — today only the eBay adapter produces those (6 hero targets), and only once migration `0021` (the `price_type` column) is applied. Until then the range/verdict still render; dots are simply absent. Resilient — nothing 404s.

**Roadmap for the value module (next):**
- **M3 — ingestion breadth:** live `listed` rows from TRR/Fashionphile/Vestiaire (currently search-links only) → the multi-site merchant grid + the colorway × condition **flex grid** become real.
- **M4 — gated/premium:** realized **sold** prices (eBay Marketplace Insights API — gated), condition-adjusted "effective price," FX/region normalization.
- **Data gaps to chase** (highest leverage first): broaden live listings beyond eBay; wire per-listing structured attributes via an LLM extraction pass (inclusions/hardware/year — `ObservationAttrs` already has the fields); then sold prices. Full analysis lives in this session's chat + `docs/data-sourcing-research.md`.

## TL;DR — operator LAUNCH session + photo/auth fixes (2026-06-22)

A parallel, operator-driven session (ran alongside the Personalization work below). **The app is now LIVE in production on the real domain.** Code changes are on `main` (`tsc`/`eslint`/`next build`/tests green at each merge).

**Operator milestones (done today, see `docs/desktop-todo.md`):**
- 🌐 **Live on `https://www.luxurycatalog.com`** (DNS validated; `NEXT_PUBLIC_SITE_URL` updated; redeployed).
- 📊 **PostHog analytics live** (`NEXT_PUBLIC_POSTHOG_KEY`, US region; verified). *Events are eaten by ad-blockers in everyday browsers — test in incognito + PostHog "Live" tab.*
- 🔍 **Sitemap submitted to Google Search Console + Bing** (indexing clock started; ~8–16 wks).
- 🖼️ Operator applied migrations **0015/0016/0017**, set self `is_admin`, and **runtime-tested the photo flow end-to-end (works).**
- 💰 **Affiliate apps in flight:** TRR Real Partners (consignor, call pending) + TRR affiliate (Impact) + Awin (Vestiaire **and** Fashionphile — ShareASale merged into Awin). When codes arrive → wire `NEXT_PUBLIC_AFFILIATE_*`.

**Code shipped this session:**
1. **Photo gallery byline bugfix** — `getApprovedPhotos`/`getPhotosForReview` (and the auth-request reads) used a PostgREST embed `profile:user_id(...)` that can't resolve (the tables FK to `auth.users`, not `profile`), so they errored → empty gallery even though photos published. Fixed with a **separate profile lookup** merged in JS (`src/lib/photos.ts`, `authentication.ts`). Also `router.refresh()` after a photo upload.
2. **Authentication marketplace = coming-soon fake door** until real authenticators exist. `hasActiveAuthenticators()` gates it: 0 authenticators → a **"Notify me when it's live"** demand-capture (analytics `authentication_interest` for everyone + a saved `authentication_request` row for signed-in users = warm launch list). Flips to the real request form automatically once any `is_authenticator` exists. Doors on **bag page, thrift `/found` success, and `/closet`** (shared `src/components/AuthInterestButton.tsx`). New **`/admin/authentication`** demand dashboard. *(To SEE the coming-soon state, the operator should drop their own test `is_authenticator` flag.)*

**Deferred / flagged:** 🔒 key rotation (A6 — plan saved, do before full public launch); ⚠️ **`/identify` camera tool isn't real yet** — make it work or give it the coming-soon treatment before public launch (desktop-todo H6); DMCA agent before promoting UGC widely (G2). **New backlog idea:** multi-source verification evidence (listing URLs + guided photos) — see Open backlog.

---

> **Latest session (2026-06-22):** Personalization Phase 2 — precomputed recs + PostHog flag gate
> (migration `0019`). See TL;DR immediately below. Phase 1 (migration `0018`) is the block below that.

## TL;DR — Personalization Phase 2: server-side recs + PostHog flag gate (latest session)

Branch `claude/intelligent-lamport-7dazm6` → merged to `main`.
`tsc --noEmit`, `eslint src`, `next build`, **144/144 tests** green.
**HUMAN-GATED:** apply migration `0019`; create the `personalized_home` flag in PostHog (see below).

### What was built

**Spec:** Phase 2 of `docs/personalization-best-practices.md` (A14, B9–B15, C16–C21).

1. **Migration `0019_user_recs.sql`** — `user_recs` precomputed recs table:
   - `(user_id, variant_id)` PK; `rank`, `score`, `why`, `algo` (affinity/popularity/explore).
   - RLS: users read own rows. Service role writes.
   - Index on `(user_id, rank)` for fast per-user reads ordered by rank.

2. **`src/lib/personalization/ranker.ts`** — pure Phase-2 ranking pipeline (34 unit tests):
   - **Affinity score**: brand (40%) + silhouette (25%) + material (15%) + hardware (12%) + size (8%) against Phase-1 profile.
   - **Bayesian popularity prior**: `count/(count+10)` — handles cold-start without raw counts.
   - **Combined score**: 70% affinity + 30% popularity.
   - **Epsilon-greedy exploration**: ε=0.1 → 1 explore slot per 10 recs (prevents filter bubble).
   - **MMR diversity re-rank**: λ=0.7 — prevents one dominant brand filling all slots.

3. **`src/lib/personalization/recs.ts`** — DB layer:
   - `computeAndStoreRecs(userId)` — full pipeline (candidates from catalog, popularity counts, Phase-1 profile → rank → upsert into `user_recs`).
   - `getPersonalizedRecs(userId, limit)` — read stored recs; synchronous first-access compute if empty.
   - Both degrade gracefully when table/key absent.

4. **`src/lib/analytics/flags.ts`** — PostHog server-side flag layer:
   - `identifyUserToPostHog(userId, {persona, budget_band, intent})` — writes persona as a PostHog **PERSON PROPERTY** (the targeting surface). Called at login via `auth-actions.ts` to stitch anonymous→identified.
   - `evaluatePersonalizationFlag(userId, personProps)` — server-side eval of `personalized_home` flag via posthog-node (`flushAt:1`, `await shutdown`), passing `personProperties` explicitly.
   - `getBootstrapFlags(userId, personProps)` — evaluates ALL flags server-side for client bootstrap.

5. **Home page (`src/app/page.tsx`)** — flag gate on the recommendations rail:
   - Server-side: evaluates `personalized_home` flag → renders `<PersonalizedRecs>` (test variant) or existing `<Recommendations>` (control). Decision baked into SSR HTML — no flicker.
   - `<PostHogFlagBootstrap flags={...} />` — client component that calls `posthog.featureFlags.override()` on mount, keeping the client SDK in sync for experiment event tracking.

6. **`src/components/PersonalizedRecs.tsx`** — personalized rail (reads from `user_recs`; falls back to quiz CTA). Same `RecommendationCard` as control.

7. **`/api/cron/rebuild-recs`** — nightly batch at 04:00 UTC (after profiles rebuild at 03:00). Added to `vercel.json`.

### Human-gated steps

1. **Apply `0019_user_recs.sql`** in Supabase SQL editor. Safe after 0018.

2. **Create `personalized_home` flag in PostHog** (app.posthog.com → Feature Flags → New):
   - Key: `personalized_home`
   - Rollout: **Multi-variant experiment** — variant `control` (50%) and `test` (50%).
   - Targeting condition: `persona IS SET` (person property, not a cohort).
   - Guardrail metrics: `recommendation_clicked` (CTR) and `item_saved` (conversion).
   - Leave at 0% rollout until you're ready to experiment; the code degrades to the control (existing recs) when the flag returns false.

3. **Trigger first recs rebuild** (optional but recommended — otherwise waits for 04:00 cron):
   ```
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.vercel.app/api/cron/rebuild-recs
   ```
   Or hit it from Vercel's cron dashboard.

4. **Experiment is self-contained**: if PostHog key is unset or the flag doesn't exist, the home page falls through to the existing content-based `<Recommendations>` — nothing breaks.

### Next: Phase 3
Phase 3 is: Voyage embeddings + hybrid search (BM25 + dense vector + RRF rerank). Enables semantic search ("something for evening", "very structured, minimal hardware") and replaces the attribute ranker with a learned embedding space. Requires enabling pgvector, a VOYAGE_API_KEY, and a backfill job.

---

> **Prior session (2026-06-22):** Personalization Phase 1 — `user_profile` feature store +
> deterministic aggregation (migration `0018`). See TL;DR immediately below.
> Earlier: photo-contributions + contributor-tier system; monetization-moment audit;
> voice & tone rewrite; finance/money compliance.

## TL;DR — Personalization Phase 1: feature store + deterministic aggregation (latest session)

Branch `claude/intelligent-lamport-7dazm6` → merged to `main`.
`tsc --noEmit`, `eslint src`, `next build`, **110/110 tests** green.
**HUMAN-GATED:** apply migration `0018` (see below); set `SUPABASE_SERVICE_ROLE_KEY` for the cron.

### What was built

**Spec:** Phase 1 of `docs/personalization-best-practices.md` (A4–A7, B8).

1. **Migration `0018_user_profile_feature_store.sql`** — `user_profile` feature table:
   - Typed columns: `persona` (synced from profile), `budget_band` (entry/mid/grail/mixed),
     `intent` (buying/selling/collecting/browsing/both), `top_affinities` jsonb (top-10 brands).
   - JSONB columns: `brand_affinities` (full brand→score map), `attribute_affinities`
     (dimension→{value:score}), `signal_counts` (want/have/had/watchlist/review counts + quiz
     completeness), `taste_vector_snapshot` (quiz+closet TasteVector — Phase 3 adds pgvector here).
   - RLS: users read own row only. Service role writes all (no service_role policy — it bypasses
     RLS by design). `user_id` is the PK (implicitly indexed).
   - SQL functions for pg_cron: `rebuild_user_profile(uuid)` (one user, same decay/weight logic
     as TypeScript) and `rebuild_all_user_profiles()` (batch, error-per-user, safe).
   - pg_cron schedule (apply manually in Supabase): `select cron.schedule('rebuild-profiles', '0 3 * * *', 'select rebuild_all_user_profiles()');`

2. **`src/lib/personalization/`** — the TypeScript feature-store layer:
   - `types.ts` — `PersonalizationProfile`, `RawUserSignals`, `ClosetSignal`, `WatchlistSignal`, etc.
   - `aggregation-core.ts` — pure functions (no DB): `decayWeight`, `itemWeight`, `inferBudgetBand`,
     `inferIntent`, `computeBrandAffinities`, `topAffinities`, `computeAttributeAffinities`,
     `aggregateSignals`. Status weights: have=3.0, want=1.5, had=1.0. Decay: ≤7d→1.0, ≤30d→0.8,
     ≤90d→0.6, ≤365d→0.4, older→0.2. Budget band: 60%+ in one bin wins, else 'mixed'.
   - `aggregation.ts` — DB read layer (closet_item JOIN variant attrs, watchlist, review count,
     profile taste_vector snapshot) → calls aggregation-core.
   - `user-profile.ts` — `getUserProfile(userId)` (fast read from `user_profile`; triggers
     synchronous rebuild on first access if no row) + `rebuildUserProfile(userId)` (compute +
     upsert). Both degrade gracefully (return null) if migration absent or service-role key unset.

3. **`/api/cron/rebuild-profiles`** — Vercel cron endpoint (CRON_SECRET-gated); iterates all
   profile rows, calls `rebuildUserProfile()`, returns `{total, rebuilt, failed}`. Scheduled at
   03:00 UTC daily in `vercel.json`.

4. **38 new unit tests** (`src/lib/__tests__/personalization.test.ts`) covering every pure function
   and the full `aggregateSignals` integration (cold-start, normal, grail buyer, seller, collector).

### Human-gated steps
- **Apply migration `0018_user_profile_feature_store.sql`** in Supabase SQL editor (or CLI).
  Depends on nothing new — safe to apply right after 0017. Degrades gracefully if absent
  (all helpers return null, no app surface broken).
- **Set `SUPABASE_SERVICE_ROLE_KEY`** — required for the cron and first-access rebuild; no-ops without it.
- **Optional pg_cron:** `select cron.schedule('rebuild-profiles', '0 3 * * *', 'select rebuild_all_user_profiles()');` — an alternative to the Vercel cron for in-DB scheduling.

### Next: Phase 2
Phase 2 is: server-side personalization gated by PostHog — precompute per-user recs table,
attribute/affinity ranker + Bayesian cold-start + epsilon-greedy + MMR diversity, PostHog flag
evaluated server-side targeting a persona *person property*, bootstrapped to client (no flicker),
wrapped in an Experiment. Apply to 1–2 real surfaces (home "bags you might like", search ranking).
Spec: `docs/personalization-best-practices.md` A14, B9–B15, C16–C21.

---

## TL;DR — photo contributions + contributor tiers (latest session)

Branch `claude/daily-review-planning-hqj3hg`. The queued UGC engine from "▶ QUEUED NEXT BUILD" (below)
is now built. `tsc`, `eslint src`, `next build`, **72/72 tests** green. **HUMAN-GATED:** migration
**`0016`** + a Storage bucket + the service-role key (see checklist). File upload could not be
runtime-tested here (no creds); everything degrades gracefully if 0016/bucket/key are absent.

1. **Migration `0016_photo_contributions.sql`** — `bag_photo` table (variant_id, user_id,
   storage_path, caption, status [pending/approved/featured/rejected], owner_attested, points_awarded)
   + RLS (public read published; insert own as pending+attested; delete own; admin update);
   `profile.contribution_points int` (UPDATE revoked from clients — anti-gaming); **Storage bucket
   `bag-photos`** (public read) + storage RLS. No `ALTER TYPE` caveat (fresh enum).
2. **Tiers are DERIVED, not stored** — `src/lib/contributions-core.ts` (pure, 12 unit tests):
   Aficionado → Collector (has closet) → Connoisseur (approved photo) → **Authenticator**
   (`is_authenticator`, admin-granted → **auto-publish**) → Curator (Authenticator + ≥500 pts). XP is
   rarity-weighted (first photo of an uncovered bag = most) with reversal on removal.
3. **Hybrid moderation** — trusted tiers (Authenticator/admin) auto-publish via service-role;
   everyone else is queued. `src/lib/photo-actions.ts` (`submitPhoto` upload+insert, `reviewPhoto`
   approve/feature/reject with XP + hero promotion + `notifyPhotoFeatured`, `deleteOwnPhoto`);
   `src/lib/photos.ts` (resilient reads). Featuring promotes the shot to `variant.image_url`
   (`image_source:'ugc'`), demoting any prior featured (one-featured-per-variant unique index).
4. **UI** — bag page `PhotoContributions` (gallery w/ byline + rare-find empty state + attested
   upload, on `#photos` + jump-nav); admin `/admin/photos` moderation queue (+ admin index link);
   `/photos/most-wanted` board (demand-ranked photoless bags; needs service role); profile
   `ContributorCard` (tier + points + next-tier hint). New event `photo_submitted`.

**Follow-ups:** grant `is_authenticator` to vetted contributors so they auto-publish; **register a
DMCA agent before promoting UGC widely** (`docs/desktop-todo.md` G2); the "Most Wanted" board is
demand-ranked only with the service-role key (else empty state).

## TL;DR — authentication-marketplace on-ramp, v1 (latest session)

Branch `claude/daily-review-planning-hqj3hg`. The marketplace was **PAUSED**; resumed this session
at the **lead-capture scope (Recommended)** — explicitly **money-free**, so it stays out of
`finance-compliance.md` **Phase C** (on-platform payments = a separate, attorney-gated build).
`tsc`, `eslint src`, `next build`, **72/72 tests** green. **HUMAN-GATED:** migration **`0017`**.

1. **Migration `0017_authentication_requests.sql`** — `authentication_request` (variant_id,
   requester user_id, contact_email, details, status [open/claimed/closed], claimed_by) + RLS:
   requester insert/read own; **verified Authenticators** (`is_authenticator`) read the open queue +
   their claims and may claim/close; admins read all. Contact email is withheld from the open queue
   (revealed only on claim).
2. **Flow:** bag page → **"Want a pro to check it?"** (`RequestAuthentication`, in the How-to-
   authenticate area, always rendered) → lead row. **`/authenticate` hub** shows the requester their
   requests and gives Authenticators the **claim queue** + their claimed requests (with contact). The
   two arrange pricing/service **off-platform** (no custody → no money-transmitter burden). Profile
   gets an "Authentication / Authenticator queue" link. New event `authentication_requested`.
3. **Ties to the tier ladder:** the `is_authenticator` tier (auto-publish on photos) is the same
   verified cohort that staffs this queue — the contributor pipeline now has a destination.

**Follow-ups / deferred to Phase C (needs your go-ahead + an attorney):** on-platform quoting threads,
Stripe Connect payments, the 25% platform take, 1099-K/OFAC. v1 deliberately stops short of all of it.
**Operator:** apply `0017`; grant `is_authenticator` to vetted pros (same flag as photo auto-publish).

## TL;DR — monetization-moment placement audit (this session, earlier — MERGED to `main`)

Merged to `main`. Code + docs; **no DB migrations, env vars, or seed changes.**
`tsc`, `eslint src`, `next build`, **60/60 tests** green.

1. **New doc `docs/monetization-moments-audit.md`** — maps each of the 4 revenue streams to the
   feature/moment that triggers it, audits placement, records the changes. Key finding: the
   **consignor referral (~$1,250/seller) is the model's biggest swing, and its triggers — closet
   `had`/`have` + the thrift `/found` log — did nothing with that intent.**
2. **Bag page (`/bag/[variantId]`):** rebuilt `BagActions` into an **above-the-fold decision cluster**
   placed under the "What it's worth" value card — want/have/had + watch **and** the Buy/Sell CTAs,
   with contextual bridges (`had` → leads with Sell; `want` → watch price). Was buried ~600 lines down,
   order Buy→Sell→Save. Detailed `WhereToBuy`/`WhereToSell` stay near price history; jump-nav Buy/Sell
   now gate on whether links resolve.
3. **Thrift `/found`:** the success screen now surfaces a **"Flipping it?"** consignor CTA (buyout +
   consign links from the logged brand/style, FTC disclosure, `outbound_consign_clicked` w/
   `source:"thrift_find"`) — the literal consignor-referral moment.
4. **Closet `/closet`:** light sell-routing nudge on the **have** group (consignor supply).
5. **Housekeeping:** renamed duplicate migration `0012_instagram_resources.sql` → **`0015`** (collided
   with `0012_bag_axis_votes.sql`; was never applied, so safe). Closed stale **PR #1** (review-only
   snapshot; code long since shipped).

**Follow-ups:** validate via PostHog (`outbound_consign_clicked` esp. `thrift_find`, `item_saved` by
status); add a desktop sticky bar only if desktop buy/sell CTR lags mobile. **Photo-contributions build
(the big queued feature) is still open** — not started this session.

## TL;DR — voice & tone rewrite (latest session)

Merged to `main`. **Copy-only** — no DB migrations, env vars, seed, schema, or logic changes; 46 files,
display strings only.

1. **Applied `docs/voice-and-tone.md`** across every user-facing surface: home/landing + global
   layout/footer, bag detail (incl. GEO/auth/price captions), search, identify, thrift `/found`,
   browse, brand pages, closet/watchlist/feed/notifications, quiz/recommendations,
   auth/onboarding/profile/settings, posts & social, the legal pages, and admin. The voice flexes by
   register (voice guide §4) — warmer in discovery & empty states, tightest at the money &
   authentication moments.
2. **Guardrails honored:** no invented facts (prices, date codes, markers, dimensions, stats); every
   hedge and legal disclosure preserved verbatim in substance; no hype superlatives, gatekeeping, or
   AI-slop; code/routes/classNames/JSX structure/analytics events/enum values untouched.
3. **Notable calls:** home hero now leads with the manifesto tagline (*"Know what it's worth — and what
   it's worth to you."*); the `/identify` intro **dropped the "what it's worth" overpromise** (the
   tool returns no value field — never-invent). Updated one taste-tagline unit test to match new copy.
4. **Verification:** `tsc --noEmit`, `next build`, `eslint src`, and **50/50 vitest tests** all green.
   No runtime test (no DB creds) — but changes are display-string-only, so no runtime behavior changed.

**Follow-ups left open:** none functional. If/when brand voice evolves, the spec is
`docs/voice-and-tone.md`; this pass already touched everything user-facing.

---

## TL;DR — finance/money compliance + Phase A legal UX (prior session, same date)

Merged to `main`. No DB migrations, no env vars, no seed changes — all additive docs + UI.

1. **New doc `docs/finance-compliance.md`** — plain-language guide to the entire "money" side of the
   app: what handles money today vs. what's planned, and the requirements + cautions per phase. The
   core mental model is a **burden ladder keyed to one question: do you ever take custody of other
   people's money?**
   - **Phase A — today (LOW):** affiliate/referral links + price data. Obligations = FTC disclosure,
     honest pricing, a privacy policy. *You are not handling anyone's money today.*
   - **Phase B — subscriptions (MEDIUM):** Stripe merchant. PCI-via-Stripe (SAQ A), auto-renewal law
     (build to **ROSCA + California ARL**; the FTC "Click-to-Cancel" rule was **vacated** July 2025),
     SaaS sales tax.
   - **Phase C — authentication marketplace (HIGH, avoidable):** the "people's money" line. **Use
     Stripe Connect and never custody funds** → Stripe is the money transmitter, not you. 1099-K
     (OBBBA restored the **$20K / 200-txn** threshold), marketplace-facilitator sales tax, OFAC is
     *your* duty.
   - **Phase D — collection-as-investment / insurance / tax (the feature the user actually asked
     about):** three sub-features, different risk. **Value tracking** = fine (not securities advice).
     **Insurance** = inventory-export + flat-fee referral, **never act as an agent** (would need a
     producer license). **Tax** = a cost-basis/holding-period **records export**, **not** a calculator
     or advice (handbags are **collectibles → max 28%**; "dealer vs. investor" trap). Across all: your
     value is an **estimate, not an appraisal**, and the data is a theft-target → extra security.
   - **Caveat in the doc:** some citations rest on cross-corroborated search summaries (several .gov/
     Stripe pages couldn't be fetched directly); time-sensitive items flagged. Not legal/tax advice —
     get one attorney + CPA review before any money feature.

2. **Phase A compliance UX shipped** (the gaps the doc found in the live build):
   - **Footer** (`layout.tsx`): site-wide affiliate + price-estimate disclaimer line + links to the
     three legal pages.
   - **`WhereToBuy.tsx`**: inline "affiliate links — we may earn a commission" notice next to the
     resale links (FTC clear-and-conspicuous; the old `rel="sponsored"` is technical-only).
   - **`PriceTrend.tsx`**: "estimate, not an appraisal or forecast" caption.
   - **New pages** `/privacy`, `/disclosure`, `/disclaimer` (Privacy grounded in what the app actually
     stores; points to `/settings` for access/delete; mentions GPC). **`next build` green; routes
     render.**

**Follow-ups left open:** (a) swap the placeholder `hello@luxurycatalog.com` in the legal pages for the
real address once email forwarding is live; (b) **Terms of Service page is still needed before the
first payment** (deferred to Phase B/C — not required while no money moves); (c) honor GPC in the
actual analytics flow (copy claims it; verify `ConsentNotice`/PostHog wiring); (d) Phase B/C/D feature
work itself is unbuilt — `docs/finance-compliance.md` is the spec.

---

## ⭐ LATEST SESSION — UX evaluation + full overhaul (PR #3) — READ FIRST

**Branch:** `claude/luxury-catalog-ux-eval-uxrubk` → **PR #3** into `main` (open, ~33 commits, clean fast-forward, no conflicts). **Unlike prior sessions, the key flows were runtime smoke-tested against the live DB this session.**

**Migrations: the live DB is now CURRENT through 0014** (operator applied 0008–0014 this session; 0011/0012/0013/0014 confirmed). New this session: `0011_four_grails`, `0012_bag_axis_votes`, `0013_variant_image` (variant.image_url + image_source), `0014_closet_purchase_price` (closet_item.purchase_price/currency/date). All new queries are **resilient** (`getVariantImages`, `getPurchaseInfo`, `getBrandResaleStats` return empty on a missing column) so nothing breaks pre-migration.

**Shipped (grounded in `docs/ux/ux-evaluation.md` + `ux-research-brief.md`; teardowns of Goodreads/StoryGraph/Letterboxd/IMDb/Discogs/Fragrantica/WatchCharts/StockX/Fashionphile-TRR-Vestiaire/KBB):**
- **Docs:** `docs/ux/ux-evaluation.md`, `ux-research-brief.md`, `sitemap-and-user-flows.md`, `ux-remaining-backlog-plan.md`.
- **Discoverability/IA:** persona router + Explore strip on home; Quiz/Watchlist in nav; "It bags" + brand items link into the bag page (not search).
- **Bag page:** Fair-Market-Range + Last-Sold, sticky action bar, **Where-to-sell** fork, jump-nav/accordions, price chart range toggles + %Δ, **resale-vs-retail split**, "How to authenticate" checklist, attribute cross-links, **dimensional Size/Colour/Hardware variant selector** (prefetch swap; instant in prod — `npm run dev` recompiles so it only *feels* like a reload in dev).
- **Search:** colour/hardware/size facets + chips + mobile tray; fixed keyword→material matching and a name-fallback so catalogued bags never dead-end.
- **Identify** monetization; **explainable recs** + cold-start fallback; **Four Grails**; **multi-axis owner voting**; **quiz pre-signup growth loop** (results free, save-on-signup via `TasteFlusher`); **Google/Facebook OAuth + usernames**; collection value; **Collection report** (`/closet/report` — insurance/estate + cost-basis/gain-loss); **Year-in-Bags recap**.
- **Visuals:** `BagImage` (branded placeholder everywhere + resilient real-photo pipeline; falls back to placeholder on load error). Populate `variant.image_url` from a **licensed** source to show real photos.
- **Brand hub:** `/brand/[id]` revamped — heritage, at-a-glance (retail ladder, highest recorded resale), "{brand} signatures" (top colours/materials/hardware/silhouettes), culture/buying-experience editorial slot, brand-level buy/sell links.

**NEXT SESSION — pick up here (confirmed wants, not yet built):**
1. ~~**Real-photo sourcing**~~ **DONE (this session).** Import tooling: `supabase/seed/import-variant-images.ts` (`npm run import:images`) bulk-populates `variant.image_url` + `image_source` from a CSV / reseller feed. Two auto-detected modes: **direct** (curated `variant_id,image_url[,image_source]`) and **feed** (reseller export — `Designer`/`Bag name`/`Photos`/`Url` like `data/raw/*.csv`; resolves brand→style→best-variant, takes the first photo, records the listing URL as `image_source` for link-back). **Licensing enforced at the tool boundary:** default is a no-write **dry run**; persisting needs `--write --licensed` (asserts display rights — see `docs/image-strategy-research.md`). Idempotent (fills blanks unless `--overwrite`); preflight aborts loudly on a bad key or a missing 0013 column. Pure matching logic in `src/lib/image-import-core.ts` (10 unit tests). `BagImage` already consumes `image_url`. *Build/test-verified; not runtime-run here (sandbox key is invalid — operator's live DB is current through 0014).*
2. **Auth-marketplace on-ramp (Rev 3) — v1 BUILT (2026-06-22).** Resumed at the **lead-capture** scope (the recommended, money-free slice): bag-page "Want a pro to check it?" → `authentication_request` → `/authenticate` hub where verified Authenticators claim from a queue and arrange the service **off-platform**. See the auth-marketplace TL;DR up top + migration `0017`. **Deferred to Phase C (PAUSED, needs a fresh go-ahead + an attorney):** on-platform quoting threads, Stripe-Connect payments, the platform take, 1099-K/OFAC.
3. **OAuth provider config (operator, human-gated):** enable Google/Facebook in Supabase Auth (client id/secret + `/auth/v1/callback`) or the buttons error.

**Deferred / data-gated (honest):** brand price **index/ticker**, **most-coveted-by-demand** (needs a `want`-demand query; private per RLS), **trending** (PostHog proxy), **upcoming releases** (news feed); Tier 4 **Durability/Ages-Well** + **Resale-Retention index** (need resale condition/age data — see `ux-remaining-backlog-plan.md`); loose thread: **brand-name-search faceting** (a design call — compact overview vs. faceted style list).

---

> **Branch:** the prior session's work is on **`claude/adoring-mccarthy-0dnhvn`**, forked from the active app lineage `claude/desktop-display-test-d621oc`. See "Lineage fork." The **latest additive session** (GEO, embedded video, social/expert layer, closet-model simplification, reviews decoupling, LV/Gucci research) is on **`claude/port-geo-video-social-onto-main`** → **PR #2** into `main`. See "Latest session" immediately below.

---

## TL;DR — where things stand

The full catalog app (search, identify/camera, browse, admin, bag detail) now has, added this session:
- **User accounts** (Supabase Auth), **closet**, **watchlist + price-trend**, **price-alert delivery**, **feedback write-side** (request-a-bag, thrift-log), **reviews & ratings**, **affiliate "where to buy"**, and **PostHog analytics** (ported from the other lineage).
- **Build health:** `next build`, `tsc --noEmit`, `eslint` all green.
- **Big caveat:** none of the DB-backed features were runtime-tested — the cloud session has **no Supabase credentials**. Everything is verified by compile/build only. The auth → save → review → alert path must be smoke-tested after setup.

**Decided this session:** image strategy (see "Images"). **Queued to build next:** the photo-contribution + contributor-tier system (fully spec'd below — start here).

---

## TL;DR — latest additive session (PR #2: GEO + UGC depth)

On top of the above, branch `claude/port-geo-video-social-onto-main` (→ **PR #2**) adds work `main` lacked. All verified by `tsc` / `eslint` / `next build`; **none runtime-tested** (no DB creds), and the new migrations are **not yet applied**.

- **Breadth research:** **Louis Vuitton Neverfull** + **Gucci GG Marmont** added (beyond the 5 hero styles).
- **GEO layer** (the marketing plan's #1 channel — see `docs/marketing-plan.md`): per-bag front-loaded fact-dense answer + FAQ (composed deterministically from real data, no LLM → honors "never invent"); dimensions in **cm + inches**; named-author byline + catalogued date; cited **Sources**; **JSON-LD** (Product/FAQPage/BreadcrumbList); `generateMetadata` (canonical/OG); **`/sitemap.xml`** + **`/robots.txt`**.
- **Embedded video reviews + curated creators** (the visual layer for a text-first v1; embedding sidesteps image copyright): migration `0004`, `creator` + `resource` tables, a click-to-load YouTube facade on bag pages with a "trusted reviewer" badge.
- **Closet model simplified to `want` / `have` / `had`** (migration `0005`): collapses the old `researching`/`wishlist`/`owned` enum (researching+wishlist → want, owned → have) and adds **had** (previously-owned).
- **Reviews decoupled from the closet:** review any bag (rented/borrowed/tried in-store); a post-review prompt offers to add it to the closet; new **`/profile/reviews`** ("My reviews").
- **Social / expert layer — schema only** (migration `0006`, UI is the next build): extends `profile` (handle, bio, `closet_public` opt-in, admin-granted `is_verified`/`is_expert`/`is_authenticator`); `closet_favorite` (follow a closet); `post` (expert blog); `closet_stats` view = "most coveted closets" (want-demand inverted + favorites). Full design + operator actions in **`docs/additive-features-port.md`**.

---

## TL;DR — engagement / social + recommendations track (this session)

Branch `claude/lucid-archimedes-1cyi21`. Implements `docs/engagement-strategy.md` §3
build order 1–7. All verified by `tsc --noEmit`, `eslint`, and `next build` (green);
**none runtime-tested** (no DB creds). Migration **0007 is human-gated** (see checklist).

1. **Social UI** — `/u/[handle]` public profile (curated `have` closet, tier/trust
   badges, `rel="nofollow ugc"` social links, Follow-closet button); `/closets`
   "Most Coveted Closets" leaderboard from `closet_stats`; verified-owner badge on
   reviews (derived from `closet_item` have/had); profile-edit flow `/profile/edit`
   (handle, bio, avatar, `closet_public`, socials). Files: `src/lib/social.ts`,
   `social-actions.ts`, `src/components/TrustBadges.tsx`, `src/app/u/[handle]/*`,
   `src/app/closets/page.tsx`, `src/app/profile/edit/*`; `getProfile` extended in `auth.ts`.
2. **Activity feed** — `src/lib/feed.ts` (structured events from followed closets,
   honoring 0006 privacy: only public `have` adds, plus reviews & published posts);
   `/feed` route + logged-in home Activity strip + header link; `src/components/FeedItem.tsx`.
3. **Taste quiz** — `src/lib/taste.ts` (model/questions/named-taste over real
   catalogued attributes only), `taste-data.ts` (blends quiz+closet+watchlist),
   `taste-actions.ts` (persists `profile.taste_vector`/`taste_completeness`);
   `/quiz` + `QuizClient` either/or + shareable card.
4. **Bags you might like** — `src/lib/recommendations.ts` content-based attribute
   scoring with deterministic "why" string, cold-start stub; surfaced on home,
   profile, and bag pages (`getSimilarBags`). `src/components/Recommendation*.tsx`.
5. **Taste Map** — `src/components/TasteMap.tsx` + `TasteMapSection.tsx`: visual
   region grid + completeness meter + "answer N more" on the profile.
6. **Re-engagement notifications** — `notifications.ts` gains `notifyFollowersOfActivity`
   (service-role fan-out) + `notifyClosetActivity`/`notifyPhotoFeatured`; wired into
   `saveToCloset` (have), `submitReview`, and `favoriteCloset`. `photo_featured` helper
   is the ready hook for the future photo system (no event point exists yet).
7. **Collaborative recs** — item-item co-occurrence ("collectors who have X also want
   Y") in `recommendations.ts`, blended BEHIND content-based; needs the service-role
   key (degrades to content-only otherwise).

Analytics: new events in `src/lib/analytics/events.ts` — `quiz_started`, `quiz_completed`,
`recommendation_clicked`, `closet_favorited`, `taste_map_viewed`.

**Launch-hardening session (this one):** (1) admin auth gate (above + checklist 1);
(2) `/auth/confirm` now handles the default free-tier PKCE `?code=` flow too
(checklist 3); (3) quality pass on the engagement code — reviewed clean (privacy
enforced server-side via RLS + filters, empty states handled, Next 16 params
awaited), and the pure logic was extracted into no-DB cores (`taste-core.ts`,
`recommendations-core.ts`, plus `buildVectorFromAnswers` in `taste.ts` and
`sortFeedEvents`/`bagFrom` in `feed.ts`); (4) **unit tests added** — `vitest`
devDependency + `vitest.config.ts` + `npm test`; 38 tests in `src/lib/__tests__/`
covering taste-vector/folding/completeness, recommendation scoring + "why", and
feed assembly/sort. All of `tsc`, `eslint`, `next build`, `npm test` green.

**Human-gated for this track:** apply migration **0007** (see the note + the
`ALTER TYPE` transaction caveat in the checklist); set `SUPABASE_SERVICE_ROLE_KEY`
to enable follower notifications + collaborative recs (both no-op without it). No new
env vars or Storage buckets otherwise. Smoke-test: handle/closet-public opt-in →
public `/u/[handle]` → follow → feed → quiz → recs → notifications.

---

## TL;DR — expert posts + corrections + settings session (this one)

Branch `claude/lucid-archimedes-1cyi21` (continues the engagement track). All verified
by `tsc --noEmit`, `eslint src`, `next build`, `npm test` (62 tests now); **none
runtime-tested** (no DB creds). Two new migrations are **human-gated**.

1. **Expert editorial posts** (Task 1) — uses the existing 0006 `post` table (NO
   migration). Public `/posts` (list) + `/posts/[slug]` (Article JSON-LD with named
   author byline + datePublished, `generateMetadata`/canonical/OG, related-catalog
   "Sources" from topic_brand/topic_style). Authoring gated by `profile.is_expert`
   server-side in every action AND hidden in UI: `/posts/new`, `/posts/[slug]/edit`,
   `/profile/posts` dashboard. Draft→publish sets `published_at`; slug auto-generated
   + de-duped (`posts-core.ts`, unit-tested). Files: `src/lib/posts.ts`,
   `posts-core.ts`, `post-actions.ts`, `src/app/posts/*`, `src/app/profile/posts/*`.
   "Articles" in header nav; author's posts on `/u/[handle]`; posts in sitemap;
   `post_published` event.
2. **Suggest-an-edit / corrections** (Task 2) — migration **`0009_corrections.sql`**
   (`correction` table; RLS: authed INSERT/SELECT own, admin SELECT all + UPDATE
   status, public can't read). "Suggest an edit" widget on `/bag/[variantId]`
   (auth-gated); admin review queue `/admin/corrections` (accept/reject — accept does
   NOT auto-write the catalog, applying is manual). Files: `correction-actions.ts`,
   `corrections.ts`, `src/app/admin/corrections/*`, `SuggestEdit.tsx`;
   `correction_submitted` event.
3. **Settings & account** (Task 3) — `/settings`: email/password via the user's own
   session; notification prefs (migration **`0010_notification_prefs.sql`** adds
   `profile.notification_prefs jsonb`, default-on; wired into `insertNotificationFor`,
   `notifyFollowersOfActivity`, and the price-alert cron via `isOptedIn()`); delete
   account via service-role `admin.deleteUser` after email confirm (degrades clearly
   without the key). Files: `settings-actions.ts`, `src/app/settings/*`; `getProfile`
   extended with `notificationPrefs`.
4. **Hero-research re-verification** (Task 4) — Hermès blind-stamp + Chanel serial
   era systems re-verified; system-level facts raised medium→high with cited sources,
   per-year tables left unasserted. JSON only; **re-run `seed-hero-styles.ts`**.
5. **Video creator seed** (Task 5) — `supabase/seed/research/creators.json` +
   `seed-creators.ts` (idempotent; real channels + real video IDs verified from web
   search; 9 resources across the 5 hero styles). **Run `seed-creators.ts`** (needs
   service-role key; 0004 + hero styles first).

**Human-gated for this session:** apply **`0009_corrections.sql`** and
**`0010_notification_prefs.sql`** (both degrade gracefully if absent). Set
`SUPABASE_SERVICE_ROLE_KEY` for account deletion + cross-user notification opt-outs.
Grant `profile.is_expert` (service role) to anyone who should author posts. Re-run
`seed-hero-styles.ts` (corrected research) and `seed-creators.ts` (video resources).
**Migration numbering note:** the future photo-contributions migration becomes
**`0011`** (0009 = corrections, 0010 = notification_prefs).

---

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
| Docs | `docs/handoff.md` (this), `docs/finance-compliance.md` *(this session — the money/legal spec for Phases A–D)*, `docs/marketing-plan.md` + `docs/additive-features-port.md` *(PR #2)*, `docs/monetization-projections.md` (12-mo take-home model, re-run vs. updated UX/marketing), `docs/image-strategy-research.md`, `docs/product-brief.md`, `docs/project-status.md` |
