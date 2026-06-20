# Luxury Catalog — Handoff Document
*Updated 2026-06-20. Current source of truth — read this first. Supersedes prior handoffs; carried-forward items (DNS, credentials, hero-research caveat) are preserved below.*

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

## ⚙️ Human-gated setup checklist (nothing DB-backed works until these are done)

1. **Apply migrations** (Supabase SQL editor / CLI), in order:
   - `0001_init_schema.sql` (already applied previously)
   - `0002_user_features.sql` — profile, closet_item, watchlist, bag_request, thrift_find (+ RLS, new-user trigger)
   - `0003_reviews_notifications.sql` — review, notification (+ RLS)
   - `0004_resources_creators.sql` *(PR #2)* — creator + resource (embedded video reviews); public read / admin write
   - `0005_closet_status_want_have_had.sql` *(PR #2)* — closet_status enum → `want`/`have`/`had` (data-migrating; collapses researching/wishlist→want, owned→have)
   - `0006_social_expert_layer.sql` *(PR #2)* — extends `profile` (handle/social/trust flags), `closet_favorite`, `post`, `closet_stats` view
   - `0007_*` — photo contributions (when the queued feature is built; was sketched as `0004`)
2. **Run seed scripts** (need `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):
   ```
   npx tsx supabase/seed/seed-hero-styles.ts
   npx tsx supabase/seed/seed-breadth.ts
   ```
   Both idempotent. The live DB still has the *old* seed data until these run.
3. **Supabase email-confirm template** → point at `/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}` (Auth → Email Templates), or disable confirmation while testing.
4. **PostHog**: set `NEXT_PUBLIC_POSTHOG_KEY` (+ optional `POSTHOG_KEY`); enable "Cookieless server hash mode"; optionally run `node scripts/setup-posthog.mjs`. **Add `.mcp.json` manually** (I don't auto-create startup config — snippet in `.env.example`/below).
5. **Price alerts**: set `CRON_SECRET` (Vercel injects it as the cron Authorization header); optional `RESEND_API_KEY` + verified sender for email. `vercel.json` already schedules the job daily.
6. **Affiliate**: sign up for programs; set `NEXT_PUBLIC_AFFILIATE_*` codes / `NEXT_PUBLIC_AFFILIATE_WRAP_TEMPLATE`.
6a. **GEO (PR #2)**: set `NEXT_PUBLIC_SITE_URL` (→ luxurycatalog.com when DNS is live; defaults to the vercel.app URL) and `NEXT_PUBLIC_AUTHOR_NAME` (your real name strengthens the E-E-A-T signal). After deploy, **submit `/sitemap.xml`** to Google Search Console + Bing Webmaster Tools (Bing powers ChatGPT search).
6b. **Curate video resources (PR #2)**: add `creator` rows for vetted reviewers + `resource` rows linking their best videos to styles (admin/seed) to light up the bag-page "Video reviews" sections.
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

## ▶ QUEUED NEXT BUILD: photo contributions + contributor tiers
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
- **Social UI (PR #2 schema is ready)** — `/u/[handle]` public closet (Poshmark-style), "most coveted closets" leaderboard (`closet_stats`), expert blog gated behind `is_expert`, and a "Verified owner" badge on reviews (derive from `closet_item` have/had). Trust flags are admin-granted.
- **Authentication Marketplace** (Thumbtack model; revenue #2) — the tier ladder + `is_authenticator` profiles feed it.
- **Premium tools / search-capability paywall** (Figma "Plan selector"; `monetization_interest` event exists, no UI). Catalog stays free.
- **Settings & account management** (edit email/password, notification prefs, delete account).
- **Admin auth gate** — `/admin/*` is still unauthenticated; gate it (e.g. `profile.is_admin`) before sensitive data lands.
- **Brand depth** — 9 stub brands (drop full Drive CSV into `data/raw/`, re-run seeder) + browser-based hero-style research passes.
- **Hero-research accuracy** — re-verify Session-2 snippet-sourced data (capped at `medium`; WebFetch was blocked) before presenting as fact; Hermès blind-stamp + Chanel serials especially.
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
| Affiliate | `src/lib/affiliate.ts`, `src/app/bag/[variantId]/WhereToBuy.tsx` |
| GEO *(PR #2)* | `src/lib/geo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, JSON-LD + `generateMetadata` in `src/app/bag/[variantId]/page.tsx` |
| Video/creators *(PR #2)* | `src/lib/youtube.ts`, `getResourcesForStyle` in `queries.ts`, `src/app/bag/[variantId]/Resources.tsx` |
| Social/expert *(PR #2, schema)* | `supabase/migrations/0006_social_expert_layer.sql` |
| Analytics | `src/lib/analytics/*`, `src/app/providers.tsx`, `src/instrumentation-client.ts`, `scripts/*`, `.github/workflows/analytics-digest.yml` |
| Feedback/admin | `src/lib/actions.ts`, `src/app/admin/*` |
| Data | `supabase/migrations/000{1..6}_*.sql`, `supabase/seed/*` (incl. research `louis-vuitton-neverfull.json`, `gucci-gg-marmont.json`), `data/raw/*.csv` |
| Docs | `docs/handoff.md` (this), `docs/marketing-plan.md` + `docs/additive-features-port.md` *(PR #2)*, `docs/monetization-projections.md` (12-mo take-home model, re-run vs. updated UX/marketing), `docs/image-strategy-research.md`, `docs/product-brief.md`, `docs/project-status.md` |
