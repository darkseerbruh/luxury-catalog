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
