# Luxury Catalog — Handoff Document
*Updated 2026-06-20 (Session 3: user accounts + engagement features). Read this before doing anything in the next session.*
*Supersedes the prior handoff; still-outstanding items (DNS, credentials, seed run) are carried forward below.*

---

## TL;DR — Session 3 (2026-06-20)

Branch: **`claude/adoring-mccarthy-0dnhvn`** (based on the active `claude/desktop-display-test-d621oc`, so it contains everything from Session 2 plus the below). Heads-up for next session: the Session-2 work lives on `desktop-display-test-d621oc`; this session's branch was forked from it — confirm which branch is "active" before building.

Built the four next-up use cases from the backlog. **App `next build` / `tsc` / `eslint` all pass**, but none of it could be exercised against a live DB (cloud session has no Supabase creds), so treat it as reviewed-by-compile, not runtime-tested.

1. **User accounts (Supabase Auth)** — email+password signup/login/logout, email-confirm route, onboarding (persona capture), profile. Cookie-based SSR via `@supabase/ssr` + Next 16 `proxy.ts` (Middleware was renamed to Proxy in v16).
2. **Closet** — save bags as researching/wishlist/owned (`/closet`); Save buttons on bag pages; home "Your closet" is now real.
3. **Watchlist + price alerts** — watch a bag, set a target price, toggle alerts (`/watchlist`); price-trend sparkline on bag pages from `price_history`. (Alert *delivery* is not built — see open items.)
4. **Feedback loop write-side** — "Request this bag be added" on dead-end searches; thrift-find logging (`/found`) + CTA from the camera tool; new `/admin/requests` dashboard.
5. **Breadth seeding deepened** — reseller CSVs now map into variant + production + fits rows (not just colorway/price); seeder generalized to all brands so the full Drive export auto-populates the 9 stub brands when added.
6. **PostHog analytics ported in** — the cookieless-first analytics foundation from the `luxury-catalog-analytics-plan-kiq8al` lineage was merged into this app and wired to its real surfaces (see "Analytics" below).

> 🔱 **Lineage fork resolved this session.** There were two parallel apps: **Lineage A** (search/identify/admin/closet — this branch) and **Lineage B** (`luxury-catalog-analytics-plan-kiq8al`, a PostHog-instrumented prototype with a tier/silhouette filter home and Polène/Telfar/Longchamp seed). The user was running B locally and noticed "no search" — B never had it. **Decision: A is canonical; B's analytics were ported into A.** B can now be archived; its alternate home/`/bags/[id]` pages and sample-data were intentionally NOT brought over.

> ⚠️ **Human-gated before this is "done" (carried forward + new):**
> 1. **NEW — apply migration `0002_user_features.sql`** to Supabase (adds profile/closet/watchlist/bag_request/thrift_find + RLS + a new-user trigger). Nothing in items 1–4 works until this is applied.
> 2. **NEW — set Supabase email-confirm template** to point at `/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}` (Auth → Email Templates), or disable email confirmation for testing.
> 3. **Run the seed scripts** (still pending from Session 2) — research JSON + breadth are committed but the live DB still has the *old* seed data.
> 4. **DNS go-live** — `luxurycatalog.com` still points nowhere.

See "Action required" and "Open decisions / what to do next" for details.

---

## TL;DR — Session 2 (2026-06-19)

Built on top of the deployed app (branch `claude/desktop-display-test-d621oc`):

1. **Natural-language search** — `searchCatalog()` now parses queries with Claude into structured filters.
2. **Two admin dashboards** — `/admin/searched-not-found` and `/admin/feedback` (+ `/admin` index).
3. **Bag feedback loop** — "Is this accurate?" widget on `/bag/[variantId]` → `user_feedback`.
4. **All 5 hero styles researched & applied** — filled production records, colorways, fits, auth markers.
5. **Size variants added** — Kelly 25/32, Birkin 25/40, Chanel Small/Jumbo/Maxi.
6. **`price_history` seed support** — loader extended; Chanel retail trajectory added.

**Open PR:** [#1](https://github.com/darkseerbruh/luxury-catalog/pull/1) — focused review diff of features 1–3. It's a *review vehicle* (the code is already live on the active branch); close it once reviewed, don't merge.

> ⚠️ **Two things need a human before this is "done":**
> 1. **Run the seed scripts** — all the research data is committed to the seed JSON but was NOT applied to Supabase (the cloud session has no DB credentials). See "Action required" below.
> 2. **DNS go-live** — `luxurycatalog.com` still points nowhere (unchanged from last session). See "The one outstanding infra item."

---

## Current state

- **App:** fully built, deployed on Vercel, live at **`luxury-catalog-omega.vercel.app`**.
- **Active branch:** `claude/desktop-display-test-d621oc` (all code + data). `main` is the old empty scaffold — ignore it.
- **Build health:** `next build`, `tsc --noEmit`, and `eslint` all pass as of this session.

---

## 1. Features shipped this session (live in the branch)

### Natural-language search (`src/lib/queries.ts`, `src/app/search/page.tsx`)
- `searchCatalog()` calls Claude (`claude-sonnet-4-6`) via `parseSearchQuery()` to turn a free-text query into structured filters (brand, style, silhouette, size category, color, material, hardware color, carry type, width range), then runs an attribute-aware variant search grouped by style.
- Example: *"structured black bag under 10 inches wide"* → `silhouette: structured`, `color: black`, `maxWidthCm: 25.4`.
- **Graceful fallback:** if `ANTHROPIC_API_KEY` is missing or parsing fails, it falls back to the original `ilike` name matching — search never breaks.
- **Honors "never invent":** width filters exclude variants with no measured dimensions rather than assuming they qualify.
- The search page shows an "Interpreted as" chip row so users see how their query was read.
- Misses (text **and** camera) are logged to `searched_not_found`.

### Admin dashboards (unauthenticated, `noindex`, unlinked from public nav)
- `/admin` — index linking the two dashboards.
- `/admin/searched-not-found` — aggregates missed searches/camera misses by query (count, source, last-searched, resolved). Query fn: `getSearchedNotFound()`.
- `/admin/feedback` — user feedback newest-first with type badges, flag/unresolved counts, links to the referenced bag. Query fn: `getUserFeedback()`.

### Bag feedback (`src/app/bag/[variantId]/FeedbackWidget.tsx`, `src/lib/actions.ts`)
- Client widget → server action `submitFeedback()` → `user_feedback` table (record_type `variant`).

---

## 2. Hero-style research (applied to seed JSON)

All 5 hero styles were researched with a 5-angle deep-research pass and applied to `supabase/seed/research/*.json`:

| Style | Highlights of what was filled |
|---|---|
| Coach Tabby | 2 production records, 8 colorways, 6 source-backed fits, creed/auth markers (incl. the `CR652` fake tell + verified real style codes), price 475→450 |
| Hermès Kelly | Filled the empty colorways (8); refined blind-stamp placement (~2016 relocation); added Kelly 25 & 32 |
| Hermès Birkin | Dimensions for all sizes; colorways 1→5; chèvre lining; added Birkin 25 & 40 |
| Coach Swagger | `discontinued=true` (refurb noted); $450 MSRP (disambiguated from the 21); 7 colorways |
| Chanel Classic Flap | **Safety fix:** flagged the series→year sticker table as reseller-reconstructed + added the high-confidence digit-era timeline; microchip record → high; +3 colorways; Small/Jumbo/Maxi; price_history (2016→2025) |

### ⚠️ Critical caveat on this data — REVIEW BEFORE TRUSTING
- **Environmental limitation:** in the cloud session, `WebFetch` was HTTP 403-blocked on every primary/retail site (coach.com, Macy's, SEC, authentication blogs). All values were extracted from **WebSearch snippets**, not rendered pages.
- Therefore **no field reaches `verified`** — confidence is capped at `medium`. Conflicts are flagged inline (e.g. leather Tabby height 6″ vs 5.5″; Chanel 2019 $5,800 vs the stored $6,500). Unverifiable fields are left `null` per the brief's "never invent" rule.
- **Recommended:** a human should open the cited coach.com / reseller pages from a normal browser to upgrade key numbers (heights, prices, hardware tones) to `verified`, and sanity-check the Hermès/Chanel authentication details before they're presented to users as fact.
- The original per-style research drafts are preserved in the session log; the Coach Tabby draft is at `docs/research-drafts/coach-tabby-26-auth-draft.md` as a worked example of the format.

### Size variants & price_history (this session)
- New size variants carry **cited dimensions only**; material/colorway/price are `null` at the size-archetype level (with notes). Explicit `variant_index` is set on all variants and production records so the loader's index mapping is unambiguous.
- `seed-hero-styles.ts` now imports a `price_history` array (it omits `date_recorded` when absent so the column default applies). Only Chanel currently has price_history rows.

---

## ✅ Action required before this is production-true

1. **Apply the new migration** (Session 3) before anything else — the auth/closet/watchlist/feedback features depend on it:
   ```
   # via Supabase SQL editor or CLI, run:
   supabase/migrations/0002_user_features.sql
   ```
   Adds `profile`, `closet_item`, `watchlist`, `bag_request`, `thrift_find` with RLS and a trigger that auto-creates a profile row on signup.
2. **Point the Supabase email-confirm template** at `/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}` (Auth → Email Templates → Confirm signup), or turn off email confirmation while testing. Without this, the signup confirmation link won't land in the app.
3. **Run the seed scripts against Supabase** (needs `SUPABASE_SERVICE_ROLE_KEY` + URL in a local `.env`, which the cloud session does not have):
   ```
   npx tsx supabase/seed/seed-hero-styles.ts
   npx tsx supabase/seed/seed-breadth.ts
   ```
   Both are idempotent (clear + re-insert per style). The research JSON + deepened breadth are committed but the live DB still has the *previous* seed data until this runs.
4. **Smoke-test the auth flow** once 1–3 are done: sign up → confirm → onboarding → save a bag → watchlist. This is the one path that couldn't be tested in the cloud session.
5. **Wire up PostHog** (analytics is inert until this is done):
   - Set `NEXT_PUBLIC_POSTHOG_KEY` (+ optional `POSTHOG_KEY`/`POSTHOG_HOST` for server events) in Vercel/`.env.local`. See `.env.example` and `docs/analytics-setup.md`.
   - Enable "Cookieless server hash mode" in PostHog project settings (required for the Tier-1 baseline).
   - **Add `.mcp.json` manually** — I did not auto-create it (it's agent startup config). To get the PostHog MCP server, add:
     ```json
     { "mcpServers": { "posthog": { "command": "npx", "args": ["-y","mcp-remote@latest","https://mcp.posthog.com/mcp","--header","Authorization:${POSTHOG_AUTH_HEADER}"], "env": { "POSTHOG_AUTH_HEADER": "Bearer ${POSTHOG_PERSONAL_API_KEY}" } } } }
     ```
   - Optional: run `node scripts/setup-posthog.mjs` to provision dashboards, and the weekly digest workflow (`.github/workflows/analytics-digest.yml`) needs `POSTHOG_PERSONAL_API_KEY`/`POSTHOG_PROJECT_ID` secrets.
6. **Review the accuracy-critical data** from Session 2 (see caveat below) — especially Hermès blind-stamp and Chanel serial details.
7. **DNS go-live** (below).

---

## Session 3 — features shipped (code, pending DB apply)

### Auth (`@supabase/ssr`, Next 16 Proxy)
- `src/lib/supabase/{server,client,admin}.ts` — cookie-aware server client, browser client, and a **service-role admin client** (server-only) used by admin dashboards to read RLS-protected tables.
- `src/proxy.ts` — Next 16's renamed Middleware; refreshes the session each request. No-op without env.
- `src/lib/auth.ts` (`getCurrentUser`, `getProfile`), `src/lib/auth-actions.ts` (`signIn`/`signUp`/`signOut`), `src/lib/profile-actions.ts` (`completeOnboarding`).
- Pages: `/login`, `/signup`, `/onboarding`, `/profile`, route handler `/auth/confirm`. Header nav + home are auth-aware.

### Closet & watchlist (`src/lib/collections.ts`, `collection-actions.ts`)
- `/closet` (grouped by status), `/watchlist` (target price + alert toggle via `WatchControls`).
- `BagActions` (save/watch) + `PriceTrend` (SVG sparkline) on `/bag/[variantId]`.
- RLS scopes every row to `auth.uid()`.

### Feedback write-side (`src/lib/actions.ts`)
- `requestBag` (search dead-ends → `bag_request`), `logThriftFind` (`/found` + camera CTA → `thrift_find`). Both anonymous-friendly.
- `/admin/requests` reads both via the service-role client; linked from `/admin`.

### Breadth (`supabase/seed/seed-breadth.ts`)
- Maps reseller CSV columns into variant + production_record + fits (was colorway/price only). Skips hero style names. Idempotent per style. Brand allowlist generalized to all known brands.
- **The 9 stub brands stay stubs**: both CSVs in `data/raw/` contain only Chanel/LV/Hermès. The full `theluxurycloset_data.csv` in Drive (38.7 MB, id `1WOtJIw_Y9By-7BjHZu4MgXkFZ00-hgeC`) is too large to pull into a cloud session — drop it into `data/raw/` and re-run the seeder and the 9 brands populate automatically.

### Analytics (`src/lib/analytics/*`, ported from Lineage B)
- **Cookieless-first**: Tier-1 baseline runs for every visitor with `persistence: "memory"` (nothing on device); Tier-2 (session replay, surveys, cross-session identity) only after opt-in via `ConsentNotice`.
- `events.ts` — the single `track(event, props)` entry point + typed `EVENTS` taxonomy. `server.ts` — `captureServer()` for Route Handlers/server actions (available, not yet heavily used).
- Init in `src/instrumentation-client.ts` (before hydration); `Providers` (in `layout.tsx`) supplies `PostHogProvider` + manual App Router pageviews + the consent notice. Reverse-proxied via `/ingest` (`next.config.ts`) to dodge ad-blockers.
- **Instrumented surfaces** (autocapture covers the rest): `variant_viewed` + `price_history_viewed` (bag page, `TrackBagView`), `search_performed`/`search_not_found` (`SearchTracker`), `item_saved` (closet + watchlist), `feedback_submitted`, and new `bag_requested` / `thrift_find_logged`.
- **Not yet done**: client-side `identifyUser()`/`resetAnalytics()` on login/logout (Tier-2, consent-gated) — wire into the auth flow if you want post-auth identity stitching.

---

## The one outstanding infra item: DNS

`luxurycatalog.com` still points nowhere. Registered at **Squarespace Domains**. This cannot be done from a cloud session — it needs dashboard access.

**Step 1 — Vercel:** project → **Domains** → **Add Domain** → add `luxurycatalog.com` and `www.luxurycatalog.com`; note the A record IP and CNAME value Vercel shows.
**Step 2 — Squarespace** (`domains.squarespace.com` → DNS Settings): delete existing `@` A record and `www` CNAME, then add:
- A, host `@`, value `76.76.21.21` *(verify against what Vercel shows)*
- CNAME, host `www`, value `cname.vercel-dns.com.`
**Step 3 — Wait** 15–60 min for propagation; watch for "Valid Configuration" in Vercel.
**Step 4 — Email forwarding:** test `hello@luxurycatalog.com`; if MX got wiped, re-add `fwd1.squarespace.com.` (pri 10) and `fwd2.squarespace.com.` (pri 20).

---

## Accounts & credentials (unchanged)

| Service | For | Where |
|---|---|---|
| Supabase | DB (`pewmdztviyrtbhtebcct`) | supabase.com |
| Vercel | Hosting (team `darkseerbruh`) | vercel.com |
| Anthropic | Camera tool + NL search | console.anthropic.com |
| Squarespace Domains | `luxurycatalog.com` DNS | domains.squarespace.com |

**Vercel env vars set:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`. *(NL search uses `ANTHROPIC_API_KEY` server-side — already set, so it works in prod.)*

---

## Open decisions / what to do next

1. **`/admin` link** — the dashboards are intentionally unlinked + `noindex` (no auth on the app yet). Decide: leave as-is (recommended), add a login/secret gate, or surface a link. **No action taken; awaiting your call.**
2. **Upgrade research confidence** — re-verify the snippet-sourced numbers from a real browser to move key fields to `verified`.
3. **Remaining brand depth** — the 9 non-hero thrift/mid brands are still stubs. Fastest path: drop the full `theluxurycloset_data.csv` (Drive, 38.7 MB) into `data/raw/` and re-run `seed-breadth.ts` — the seeder now ingests every brand. A hero-style-depth research pass (like the 5 heroes got) is still the gold standard once a browser-capable session is available.
4. **Fill more hero nulls** — opening dimensions, exact stamp fonts/screw types, interior storage configs, and device-fit data remain `null` across several styles (flagged in each file's notes / `research_gaps_flagged`).
5. **Price-alert delivery (Session 3 left this)** — the watchlist stores `target_price` + `alert_enabled` and the UI flags when a recorded price is below target, but nothing *sends* alerts. Needs a scheduled job (e.g. Supabase cron / edge function) to compare new `price_history` rows against targets and email/notify; `watchlist.last_notified_at` exists for dedupe.
6. **Admin auth gate (Session 3 raised the stakes)** — `/admin/*` is still unauthenticated and `noindex`. Now that real auth exists, gate admin behind an `is_admin` flag on `profile` (or a Supabase role) before there's any sensitive data. `/admin/requests` reads via the service-role key, so it works regardless of viewer — i.e. currently anyone hitting the URL sees it.
7. **Verify RLS end-to-end** — the closet/watchlist policies (`auth.uid() = user_id`) were written but not exercised against a live DB. Confirm a second user can't read another's closet after applying `0002`.

---

## Non-negotiable constraints (from product brief)

- **Never invent** authentication markers, date codes, serial formats, or hardware details. Leave `null` + `confidence_level: low` if unverifiable.
- **No photos in v1** — text-first.
- **Catalog is always free** — no paywall.
- **Coach must be in the catalog** — it's the viral thrift-store acquisition engine.
- **Mobile-first** — every page must work at 375px width.

---

## Key files

| File | What |
|---|---|
| `src/lib/queries.ts` | All Supabase queries + NL search (`searchCatalog`, `parseSearchQuery`), `getSearchedNotFound`, `getUserFeedback` |
| `src/lib/actions.ts` | `submitFeedback` server action |
| `src/app/search/page.tsx` | Search page (NL chips, results) |
| `src/app/bag/[variantId]/page.tsx` + `FeedbackWidget.tsx` | Item detail + feedback widget |
| `src/app/admin/**` | Admin index + two dashboards |
| `src/app/identify/page.tsx`, `src/app/api/identify/route.ts` | Camera tool UI + API |
| `supabase/migrations/0001_init_schema.sql` | Full 15-table schema |
| `supabase/seed/seed-hero-styles.ts` | Hero seed loader (idempotent; now imports `price_history`) |
| `supabase/seed/research/*.json` | Per-hero-style researched data (the source of truth for hero content) |
| `supabase/seed/lib/material-resolver.ts` | Free-text material → `material_id` (null-safe) |
| `docs/research-drafts/coach-tabby-26-auth-draft.md` | Example research draft format |
| `docs/product-brief.md` | Product vision — source of truth for decisions |

### Notes for the next researcher (data model)
- Hero content lives in `supabase/seed/research/<style>.json`, loaded by `seed-hero-styles.ts` into the 15 tables.
- Child rows attach to a variant via `variant_index` (0-based). The loader auto-assigns by array position **only when every row in a section lacks `variant_index` and the count equals the number of variants**; otherwise it uses each row's explicit `variant_index ?? 0`. **When in doubt, set `variant_index` explicitly on every row** (as done for the size variants this session).
- The loader maps a fixed set of fields per table — extra keys in the JSON (e.g. `variant_ref`, `notes`, `dimension_source_note`) are ignored by the DB insert but useful as documentation.
- `confidence_level` must be one of `low|medium|high|verified`; `fits` must be `yes|no|tight`; `size_category` and other enums must match the schema.
