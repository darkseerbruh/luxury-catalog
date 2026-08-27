-- Luxury Catalog — finish what 0070 started: the last two price_history reads that still
-- die on the ~8s statement_timeout (SQLSTATE 57014).
--
-- CONTEXT (2026-08-27): price_history is 1,936,597 rows, more than double the ~928,716
-- that 0070 was written against on 2026-08-02. 0070 was applied today, and it fixed the
-- coverage counts outright. Two paths still failed on the very next run:
--
--   Daily data health (run 33120047086)   — dies at scripts/data-health.ts:318, the
--                                           per-platform live-listing count. 0070's
--                                           price_history_coverage() never covered this
--                                           one; measured 8155ms for The Luxury Closet.
--   Refresh market / Fashionphile         — reconcile-sold still 57014s (run 33120050378).
--     (run 33120050378)
--
-- WHY 0070'S INDEX WASN'T ENOUGH for reconcile. It made each keyset page cheaper, and the
-- walk does now complete on an idle database: 33 pages / 71.6s for Fashionphile, 656
-- pages / 160.5s for Rebag (measured 2026-08-27, right after 0070 landed). But the worst
-- single page was 7626ms, and these pages go through PostgREST, which has a hard ~8s
-- ceiling no index can raise. reconcile runs immediately after the crawl's write burst,
-- which is exactly when a 7.6s page becomes an 8.1s page. Rebag survived; Fashionphile
-- did not.
--
-- So the fix is not another index. It is moving the work INSIDE a function that carries
-- its own statement_timeout, the way 0070's price_history_coverage() already does, so one
-- slow page cannot fail the job. Same pattern, applied to the two reads it missed.
--
-- Shape matters too. Both reconcile modes need only the DISTINCT live listing refs, but
-- the script read every historical observation row to derive them: on 2026-08-27 that was
-- 655,786 Rebag rows in for ~18,800 refs out. A live listing keeps one available row per
-- day it is observed, so that read grew every day even when the catalogue did not.
--
-- HUMAN-GATED: apply via GitHub -> Actions -> "Apply database migrations" BEFORE the
-- matching reconcile-sold.ts / data-health.ts changes reach main. Those callers use the
-- functions defined here; landing them first turns two timeouts into two "function does
-- not exist" errors.
--
-- No new tables, so no RLS boilerplate. Both functions are security definer with execute
-- granted to service_role only — the scheduled workflows read them, the anon key cannot.

-- The index build walks ~700k rows of a 1.9M-row table on a Micro instance with throttled
-- disk IO. Give it room or the build itself gets killed. Session-scoped; reset at the end.
set statement_timeout = '600s';

-- ── 1. Index the live-listing slice ──────────────────────────────────────────
-- Complements 0070's (price_type, platform, price_id) rather than replacing it: that one
-- serves the price_id-ordered keyset walk, this one serves the DISTINCT-refs aggregate
-- below. Leading (platform, listing_ref) means the group-by arrives pre-ordered, and
-- observed_on rides in the key so max() needs no heap fetch.
--
-- Partial, because the slice is the point: it excludes the sold rows (147,220 for Rebag
-- alone) that neither query reads. Predicate matches the callers' WHERE exactly so the
-- planner can prove implication.
create index if not exists price_history_live_listing_idx
  on price_history (platform, listing_ref, observed_on desc)
  where price_type = 'listed'
    and (listing_status is null or listing_status = 'available');

-- ── 2. Distinct live listings per platform (reconcile-sold) ──────────────────
-- Keyset-paged on listing_ref: every PostgREST response caps at 1000 rows regardless of
-- limit, so an unpaged call would silently under-read and under-retire. Callers page one
-- platform at a time, so the cursor stays a single column.
--
-- listing_ref is NOT NULL here by design: reconcile can only match a snapshot on the ref,
-- and it already discarded ref-less rows client-side (130 of Fashionphile's 32,856).
create or replace function reconcile_available_listings(
  p_platforms text[],
  p_after     text default '',
  p_limit     int  default 1000
)
returns table (
  platform    text,
  listing_ref text,
  last_seen   date
)
language sql
stable
security definer
set search_path = public
set statement_timeout = '120s'
as $$
  select
    ph.platform,
    ph.listing_ref,
    max(ph.observed_on) as last_seen
  from price_history ph
  where ph.price_type = 'listed'
    and (ph.listing_status is null or ph.listing_status = 'available')
    and ph.platform = any(p_platforms)
    and ph.listing_ref is not null
    and ph.listing_ref > p_after
  group by ph.platform, ph.listing_ref
  order by ph.listing_ref
  limit p_limit;
$$;

-- ── 3. Live listing COUNT per platform (data health, line 318) ───────────────
-- Distinct listings, not rows. Fixes a second, quieter bug in the same metric:
-- data-health compared listing_image rows (one per platform+listing_ref) against
-- price_history ROW counts, which double-count every re-observation of the same listing,
-- so the ratio sank a little further every day on its own.
--
-- Case-insensitive because listing_image stores 'rebag' where price_history stores
-- 'Rebag' — the exact-match count returned 0 and quietly dropped Rebag out of the
-- denominator entirely (measured 2026-08-27).
create or replace function price_history_live_listing_count(p_platforms text[])
returns bigint
language sql
stable
security definer
set search_path = public
set statement_timeout = '120s'
as $$
  select count(distinct (lower(ph.platform), ph.listing_ref))
  from price_history ph
  where ph.price_type = 'listed'
    and (ph.listing_status is null or ph.listing_status = 'available')
    and lower(ph.platform) = any(select lower(p) from unnest(p_platforms) p)
    and ph.listing_ref is not null;
$$;

grant execute on function reconcile_available_listings(text[], text, int) to service_role;
grant execute on function price_history_live_listing_count(text[])        to service_role;

-- Keep the planner honest so the first run after this migration uses the new index.
analyze price_history;

-- Back to the default for anything that runs after this file.
reset statement_timeout;
