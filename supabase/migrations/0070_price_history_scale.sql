-- price_history has outgrown the 8s statement_timeout again. Two fixes, one migration.
--
-- CONTEXT (2026-08-02): price_history is ~928,716 rows. An exact `count(*)` over the whole
-- table now takes 8.5s and dies with 57014. Three scheduled jobs failed daily on this:
--   • Daily data health          — the unfiltered count at scripts/data-health.ts:198
--   • Classify color/material    — .range() deep-offset paging (fixed in code, no SQL)
--   • Refresh Rebag (CJ feed)    — reconcile-sold scanning every price_type='listed' row
--
-- 0055/0056/0058 fixed the previous round of these one query at a time. That approach
-- stops working once a single sequential scan of the table cannot finish in 8s, which is
-- where we now are. So: one aggregate function for the counts, one index for the scan.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. price_history_coverage(): every attribute-coverage number in ONE pass.
--
-- Daily data health computed these with SEVEN separate full-table counts (total, listed
-- total, then five `not <col> is null` counts). Each one is its own sequential scan, and
-- each has to finish inside 8s on its own.
--
-- Doing it as one aggregate scan is both faster in total and, more importantly, scoped:
-- the function carries its own statement_timeout so a growing table cannot break the
-- health run again. Same pattern as refresh_variant_price_summary() in 0055.
--
-- Kept as EXACT counts rather than planner estimates on purpose. These feed DELTA-scored
-- checks (a drop flags), and planner estimates drift with ANALYZE timing, which would
-- manufacture phantom drops.
create or replace function price_history_coverage()
returns table (
  total                bigint,
  listed_total         bigint,
  condition_n          bigint,
  condition_detail_n   bigint,
  region_n             bigint,
  production_year_n    bigint,
  hardware_color_n     bigint
)
language sql
stable
security definer
set search_path = public
set statement_timeout = '120s'
as $$
  select
    count(*)                                                                    as total,
    count(*) filter (where price_type = 'listed')                               as listed_total,
    count(*) filter (where price_type = 'listed' and condition is not null)     as condition_n,
    count(*) filter (where price_type = 'listed' and condition_detail is not null)
                                                                                as condition_detail_n,
    count(*) filter (where region is not null)                                  as region_n,
    count(*) filter (where production_year is not null)                         as production_year_n,
    count(*) filter (where hardware_color is not null)                          as hardware_color_n
  from price_history;
$$;

grant execute on function price_history_coverage() to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Index for reconcile-sold's live-listing sweep.
--
-- supabase/ingest/reconcile-sold.ts reads every `price_type = 'listed'` row for a set of
-- platforms, to work out which of our live listings the fresh snapshot no longer sees.
-- Nothing serves that shape today:
--   • 0001/0021/0024/0053 lead with variant_id
--   • 0030/0056        lead with platform + listing_status (not price_type)
--   • 0024             leads with listing_ref
-- So it sequential-scans ~928k rows and dies at 8s, taking the whole Rebag refresh with it
-- (Rebag is our single largest FREE source, ~318k rows/month, so this one is load-bearing).
--
-- The read is ALREADY keyset-paginated (gt price_id / order by price_id / limit 1000), so
-- the index has to serve the ORDER as well as the filter, or Postgres still has to sort.
-- (price_type, platform, price_id) lets it seek straight to (listed, <platform>, >cursor)
-- and walk forward in price_id order: constant cost per page.
--
-- Deliberately NOT (price_type, platform, listing_ref): that serves the filter but leaves
-- the price_id ordering unindexed, which is the half that actually times out. The per-batch
-- listing_ref lookups in the write pass are already covered by price_history_listing_ref_idx
-- (0024).
create index if not exists price_history_pricetype_platform_id_idx
  on price_history (price_type, platform, price_id);

-- Keep the planner honest right after the index lands, so the first reconcile run after
-- this migration actually uses it.
analyze price_history;
