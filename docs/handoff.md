# Luxury Catalog — Handoff Document
*Updated 2026-06-19 (feature + research session). Read this before doing anything in the next session.*
*Supersedes the original end-of-build handoff; the still-outstanding items from it (DNS, credentials) are carried forward below.*

---

## TL;DR — what changed this session

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

1. **Run the seed scripts against Supabase** (needs `SUPABASE_SERVICE_ROLE_KEY` + URL in a local `.env`, which the cloud session does not have):
   ```
   npx tsx supabase/seed/seed-hero-styles.ts
   ```
   This is idempotent (it clears + re-inserts per style). The research JSON is committed but the live DB still has the *previous* seed data until this runs.
2. **Review the accuracy-critical data** added this session (see caveat above) — especially Hermès blind-stamp and Chanel serial details.
3. **DNS go-live** (below).

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
3. **Remaining brand depth** — the 9 non-hero brands (LV, Kate Spade, Burberry, Gucci, Prada, Fendi, Celine, Dior, Bottega Veneta) are still stubs; each needs a research pass like the hero styles got.
4. **Fill more hero nulls** — opening dimensions, exact stamp fonts/screw types, interior storage configs, and device-fit data remain `null` across several styles (flagged in each file's notes / `research_gaps_flagged`).
5. **Build the UGC layer** — collection ↔ wishlist ↔ reviews, designed in the next section. This is the agreed next *big* push (needs Supabase Auth first). See **"Next major workstream"** below.

---

## Next major workstream: the UGC layer (collection ↔ wishlist ↔ reviews)

*Added 2026-06-20 (product discussion). This is a designed direction, not yet built. No code or schema has been written for it — it is the agreed next big push. Read this whole section before opening a migration.*

### The core insight
Fragrantica and StoryGraph both let a user say *"I own this / I want this / I've tried this,"* but Fragrantica then **fails to connect those shelves to anything.** It knows which fragrances you own and never asks you to review them; it knows which you want and never tells you when they're buyable. That disconnect is the opportunity. For Luxury Catalog, **ownership, wishlist, and reviews are not three features — they are one relationship a user has with a bag, in different states.** Model them together or we inherit Fragrantica's mistake.

```
                 ┌─────────── one user_bag relationship per (user, variant) ──────────┐
   WANT  ──────▶ │  status: want → own → had     (StoryGraph "shelf" / Fragrantica "I have/I want") │
                 └────────┬───────────────────────────────────────────────┬──────────┘
                          │                                                │
              "notify me when available"                        "you own this — review it?"
                          │                                                │
                          ▼                                                ▼
                 availability/price email                          REVIEW (rating + structured tags
                 → affiliate "where to buy"  ◀── intent-to-purchase   + free text) → AI summary per bag
```

### What this is made of

**1. `user_bag` — the single relationship table (the spine of the whole layer).**
One row per (user, variant) with a `status` enum: `want | own | had | considering`. This one table is simultaneously the **collection** ("My Bags" = status `own`), the **wishlist** (status `want`), and the **flipper's sold history** (status `had`). Carry: `acquired_at`, `acquisition_channel` (`thrift | retail | resale | gift` — this *is* the brief's "thrift store find logging"), `paid_price`, `condition`, `notes`, and `notify_on_availability` (bool). Status transitions over time (want → own when they buy; own → had when they sell). **"Notify me when available" is not a standalone toggle — it is a `want` row with `notify_on_availability = true`.** No separate alerts table needed.

**2. The review, tied to ownership.**
A `review` row references the user, the bag, and ideally the user's `user_bag` row. Two payloads, per the two models the user cited:
- **Structured tags (Fragrantica sliders / StoryGraph moods), bag-specific:** *holds its shape*, *heavier than it looks*, *leather softens / stays stiff*, *true to size*, *comfortable crossbody drop*, *hardware scratches easily*, *worth the price*, *everyday vs. occasion*. Controlled vocabulary so they aggregate. These tags are the soft, crowd-sourced cousins of our hard fields (`fits`, `carry_method`, `hardiness`) — and once aggregated they become **searchable facets** ("bags owners say hold their shape"), which feeds the NL search and helps every future searcher. *This is the "massively helpful to the system and to people searching" part — bake it in from the first version of reviews, not as a v2.*
- **Free text + a 1–5 rating.**
- **`verified_owner` badge** when the reviewer's `user_bag` shows they own/owned it — our equivalent of "verified purchase," and a real trust differentiator over PurseForum.

**3. AI review summarization.**
Per bag, generate a short *"What owners say"* synthesis + the top-N structured tags, using the `ANTHROPIC_API_KEY` already wired in prod. Cache it (a `review_summary` row per variant/style: `summary_text`, `top_tags` json, `source_review_count`, `computed_at`); recompute on a review-count threshold, not per page view.

### How it plugs into what already exists
- **Prompting owners to review** is a query, not a feature: `user_bag where status in (own, had) and no review yet` → a nudge on the My Bags page **and** an email. This is the connection Fragrantica never makes.
- **Wishlist = intent-to-purchase = the affiliate engine.** Aggregate `want` rows are the highest-value signal in the product (the brief's most-monetizable collector, literally telling us what to sell them). The availability email lands them on the affiliate "where to buy" link (Revenue Stream 1). A **"most-wanted index"** also becomes a data-roadmap signal exactly like `searched_not_found`, and a market-intelligence asset in its own right.
- **Reviews vs. `user_feedback`:** keep them separate. `user_feedback` is about *facts* ("is this accurate?"). Reviews are about *experience*. But a pattern of `true to size: no` tags should route into the research queue the same way searched-not-found does.

### Guardrails (do not skip)
- **The authentication-integrity rule wins.** Reviews and AI summaries are *opinion* and must be visually and semantically walled off from verified catalog facts. **Never let crowd sentiment or an AI summary flow into authentication markers, date codes, or `confidence_level`.** "Never invent" still governs the factual catalog; UGC lives in clearly-labeled, separate surfaces.
- **Auth is the hard prerequisite.** None of this exists without user accounts, and the app has **no auth today**. Step 0 is enabling **Supabase Auth** (already the planned stack, free to 10k MAU). All `user_bag`/`review` tables key off `auth.users` and need RLS.
- **Mobile-first (375px), catalog free forever** — the UGC layer is free; the existing planned paywall lever (price-drop alerts on a watchlist) sits naturally on top of `notify_on_availability` without gating the catalog.
- **No photos in v1** still holds — review photos re-open the same copyright/licensing question, so text-and-tags first; user-submitted photos later, opt-in + licensed, pending the legal review the brief flags.

### Open decisions for the human
1. **Granularity: variant vs. style.** Recommend storing ownership/reviews at **variant** level (the Kelly 25 in epsom, not "the Kelly") and **rolling up to style** for display. Confirm — it shapes the whole schema.
2. **Status set.** Is `want | own | had | considering` right, or do we want a lighter `want | own | had`?
3. **Tag vocabulary.** The structured-tag list above is a starting proposal; lock the v1 vocabulary before building (changing it after launch fragments the aggregation).
4. **Review moderation.** Public immediately, or queued? (Affects trust and abuse surface.)

### Suggested build order
1. Supabase Auth + minimal account UI (gates everything).
2. `user_bag` table + RLS → "Add to My Bags / Wishlist" on `/bag/[variantId]` → `/me/bags` + `/me/wishlist` pages.
3. Wire **"notify me when available"** to a `want` row; add the availability email job (and the `most-wanted` admin view, mirroring searched-not-found).
4. `review` + `review_tag` tables → review form on bags the user owns → owner-review nudges (page + email).
5. Aggregate tags into searchable facets + `review_summary` AI synthesis on the bag page.

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
