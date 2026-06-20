# Additive features ported onto main

*Created 2026-06-20. This branch (`claude/port-geo-video-social-onto-main`) forked from `main` and adds work `main` didn't have. A parallel session had independently reimplemented closet/watchlist/reviews/affiliate — those duplicates were **dropped**; `main`'s versions win. Only the genuinely additive pieces below were ported.*

## What this branch adds

### 1. Breadth research data
- `supabase/seed/research/louis-vuitton-neverfull.json` and `gucci-gg-marmont.json` — two new styles beyond the original 5 hero styles. Auto-discovered by `seed-hero-styles.ts`. Snippet-sourced, confidence capped at `medium`, unverifiable fields left `null`.

### 2. GEO layer (the marketing plan's #1 channel) — built, live in code
Every `/bag/[variantId]` page now has:
- A **front-loaded, fact-dense answer** + a visible **FAQ**, composed deterministically from real catalog data (no LLM → can't invent authentication facts).
- Dimensions in **cm and inches**; a named-author byline + catalogued date; a cited **Sources** section (added `sources` + `created_at` to `getVariantDetail`).
- **JSON-LD** (`Product` / `FAQPage` / `BreadcrumbList`), `generateMetadata` (title/description/canonical/OG), React `cache()` to dedupe the detail fetch.
- **`/sitemap.xml`** (per variant + brand) and **`/robots.txt`** (admin disallowed; points crawlers, incl. Bing→ChatGPT, at the sitemap).

### 3. Embedded video reviews + curated creators — built, live in code
- Migration **`0004_resources_creators.sql`**: `creator` (trusted/featured reviewers) + `resource` (embeddable item attached to brand/style/variant). Public read, admin write.
- A "Video reviews & resources" section on the bag page: click-to-load YouTube facade (thumbnail → `youtube-nocookie` iframe), trusted-creator badge. The visual layer for a no-photos v1; sidesteps image copyright. `getResourcesForStyle()` degrades to `[]` until the migration + data exist.

### 4. Social / expert layer — schema drafted (UI is the next build)
- Migration **`0006_social_expert_layer.sql`**, adapted to main's schema: **extends `profile`** (handle, bio, avatar, `closet_public` opt-in, admin-granted `is_verified`/`is_expert`/`is_authenticator`), adds `closet_favorite` (follow a closet) and `post` (expert blog), and a `closet_stats` view = "most coveted closets" ranked by **want-demand inverted** (how many others *want* the bags you *have*) + favorites. Public closets expose only `have` items of opted-in profiles; want/had stay private; trust flags are admin-only.

### 5. Closet model simplified to want / have / had + reviews decoupled — built
- Migration **`0005_closet_status_want_have_had.sql`**: collapses the old `researching`/`wishlist`/`owned` enum into **`want` / `have` / `had`**. "researching" was UX clutter and folds into a single **want** list (alerts via the existing `watchlist` table signal higher intent); **had** is new (previously-owned — flippers, and lets past owners still review). Updated `BagActions`, `/closet`, `collection-actions`, and home copy to match.
- **Reviews no longer imply ownership.** Main's `review` RLS was already ownership-agnostic, so reviewing a rented/borrowed/tried-in-store bag works. Added: a post-submit prompt ("you reviewed this but it isn't in your closet — add it?" → quick Want/Have/Had) in `ReviewForm`, and a **`/profile/reviews`** "My reviews" page linked from the profile.

## Verified
`tsc --noEmit`, `eslint` (new files), and `next build` all pass. `/sitemap.xml` and `/robots.txt` are registered routes.

## Needs the operator (outward-facing / data / infra)
1. **Run migrations 0004, 0005, 0006** against Supabase (service-role key).
2. **Set env vars** in Vercel: `NEXT_PUBLIC_SITE_URL` (→ luxurycatalog.com when DNS is live) and `NEXT_PUBLIC_AUTHOR_NAME` (your real name strengthens the E-E-A-T signal; defaults to "Luxury Catalog Research Desk").
3. **Submit `/sitemap.xml`** to Google Search Console + Bing Webmaster Tools (Bing powers ChatGPT search).
4. **Curate creator/resource data** — add vetted channels + their best videos (admin/seed task) to light up the video sections.
5. **Build the social UI** (next session): `/u/[handle]` public closet, "most coveted closets" leaderboard, and the expert blog gated behind `is_expert`.

## Note on affiliate / price alerts / reviews
`main` already has these (`WhereToBuy`, `lib/affiliate.ts`, watchlist + `api/cron/price-alerts`, `Reviews`), so my branch's versions were intentionally not ported. The marketing plan's other operator actions (apply to affiliate + consignor programs, etc.) still apply — see `docs/marketing-plan.md`.
