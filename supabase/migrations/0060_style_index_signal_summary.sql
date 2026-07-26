-- Luxury Catalog — precompute style_index_signals() into a materialized view.
--
-- WHY (2026-07-26): the LC Index aggregate had grown past Supabase's ~8s
-- statement_timeout. Measured against production 2026-07-26: 57-67s for a query that
-- returns 928 rows, over a price_history that is now 644,972 rows and growing ~41k/day.
--
-- Blast radius BEFORE this lands, and the reason it went unnoticed: loadStyleSignals()
-- (src/lib/lc-index.ts) catches the timeout and returns [], so nothing errors. It just
-- empties. /rankings renders "The Index is warming up" and no bag page can show a
-- Standing card. Confirmed on the live site 2026-07-26. The only visible symptom was the
-- Daily data health workflow failing 4 days running (2026-07-23..26).
--
-- Two separate faults, both fixed here:
--
-- 1. BAD PLAN. random_page_cost is 1.1 on this instance, so the planner treats random
--    index access as nearly free and picks a nested loop that index-scans price_history
--    once per variant: ~106k blocks (~830MB) of random heap reads on a Micro instance
--    with throttled disk IO. Forcing the seq-scan plan takes the SAME query from 57s to
--    7.1s (both measured 2026-07-26). refresh_style_index_signals() below sets
--    random_page_cost = 4 for itself only, which is enough to flip the plan.
--
-- 2. WRONG SHAPE. Even at 7s this is 645k rows in / 928 rows out on every uncached page
--    render, and it crosses 8s again within weeks at the current growth rate. The
--    aggregate moves slowly (the Index is recomputed monthly), so it belongs in a
--    materialized view refreshed by the ingest workflows — exactly the pattern
--    variant_price_summary + refresh_variant_price_summary() already use (0021, 0055).
--
-- The RPC keeps its name AND its exact return signature, so no caller has to change:
-- it now reads the view instead of computing the aggregate inline.

-- The initial build below runs the heavy aggregate once. Give it room, and give it the
-- good plan, or the CREATE takes ~57s instead of ~7s. Session-scoped; reset at the end
-- so nothing else in this migration run inherits them.
set statement_timeout = '600s';
set random_page_cost = 4;
set work_mem = '64MB';

-- ── The view ─────────────────────────────────────────────────────────────────
-- Same aggregation as style_index_signals() v3 (0051), with one structural change:
-- style/brand are joined at the END, against the 928 aggregated rows, instead of being
-- dragged through the 645k-row dedupe sort as name/tier text. Column types are cast to
-- match the RPC's RETURNS TABLE exactly (brand.tier is the brand_tier enum, so it needs
-- an explicit ::text) — that is what lets the RPC stay `select * from` this view.
drop materialized view if exists style_index_signal_summary;

create materialized view style_index_signal_summary as
  with resale as (
    select
      v.style_id,
      ph.variant_id,
      ph.price_id,
      ph.sale_price,
      ph.currency,
      ph.platform,
      ph.listing_ref,
      ph.listing_status,
      ph.observed_on,
      ph.date_recorded
    from price_history ph
    join variant v on v.variant_id = ph.variant_id
    where ph.sale_price is not null
      and ph.sale_price > 0
      and not (
        ph.price_type = 'retail_msrp'
        or (ph.price_type is null
            and ph.platform is not null
            and ph.platform ~* 'retail|boutique|msrp|in[- ]?store|flagship')
      )
  ),
  -- One row per (style, listing), keeping the latest observation of each listing.
  deduped as (
    select distinct on (r.style_id, coalesce(r.listing_ref, '__pid_' || r.price_id))
      r.style_id,
      r.variant_id,
      r.sale_price,
      r.currency,
      r.platform,
      r.listing_status
    from resale r
    order by
      r.style_id,
      coalesce(r.listing_ref, '__pid_' || r.price_id),
      r.observed_on   desc nulls last,
      r.date_recorded desc nulls last,
      r.price_id      desc
  ),
  -- Dominant currency per style = the one with the most distinct listings.
  dom_cur as (
    select style_id, currency
    from (
      select
        style_id,
        currency,
        row_number() over (partition by style_id order by count(*) desc, currency) as rn
      from deduped
      where currency is not null
      group by style_id, currency
    ) ranked
    where rn = 1
  ),
  agg as (
    select
      d.style_id,
      percentile_cont(0.5) within group (order by d.sale_price)
        filter (where d.currency is not distinct from dc.currency)          as resale_median,
      count(*) filter (where d.currency is not distinct from dc.currency)::integer
                                                                            as price_count,
      count(*) filter (
        where d.currency is not distinct from dc.currency
          and d.listing_status is distinct from 'sold'
      )::integer                                                            as live_count,
      count(distinct lower(replace(d.platform, ' ', ''))) filter (
        where d.currency is not distinct from dc.currency
          and d.platform is not null
      )::integer                                                            as source_count,
      min(d.variant_id)::bigint                                             as rep_variant_id
    from deduped d
    left join dom_cur dc on dc.style_id = d.style_id
    group by d.style_id, dc.currency
  )
  select
    a.style_id::bigint      as style_id,
    s.name::text            as style_name,
    b.brand_id::bigint      as brand_id,
    b.name::text            as brand_name,
    b.tier::text            as tier,
    a.resale_median::numeric as resale_median,
    a.price_count::integer  as price_count,
    a.live_count::integer   as live_count,
    a.source_count::integer as source_count,
    a.rep_variant_id::bigint as rep_variant_id
  from agg a
  join style s on s.style_id = a.style_id
  join brand b on b.brand_id = s.brand_id;

-- REFRESH ... CONCURRENTLY requires a unique index. style_id is unique in the output:
-- dom_cur yields at most one row per style, so the group by (style_id, dc.currency)
-- collapses to one row per style.
create unique index if not exists style_index_signal_summary_style_idx
  on style_index_signal_summary (style_id);

-- ── The refresh ──────────────────────────────────────────────────────────────
-- CONCURRENTLY so readers keep serving the previous snapshot while the rebuild runs,
-- instead of blocking on an AccessExclusive lock for the duration.
--
-- The three SETs are scoped to THIS function: 180s so a rebuild can never be killed
-- mid-flight the way the inline query was, and the two planner knobs so the rebuild
-- takes the 7s path rather than the 57s one. Mirrors refresh_variant_price_summary().
create or replace function refresh_style_index_signals()
returns void
language plpgsql
security definer
set search_path = public
set statement_timeout = '180s'
set random_page_cost = 4
set work_mem = '64MB'
as $$
begin
  refresh materialized view concurrently style_index_signal_summary;
exception
  when feature_not_supported then
    -- CONCURRENTLY needs a prior populated view; fall back on first run.
    refresh materialized view style_index_signal_summary;
end;
$$;

-- ── The RPC, unchanged in name and signature ─────────────────────────────────
-- security definer + no grant on the view itself: the readable API surface stays exactly
-- what it is today (this one function), rather than exposing a new table through
-- PostgREST. The data is the public rankings board either way.
create or replace function style_index_signals()
returns table (
  style_id        bigint,
  style_name      text,
  brand_id        bigint,
  brand_name      text,
  tier            text,
  resale_median   numeric,
  price_count     integer,
  live_count      integer,
  source_count    integer,
  rep_variant_id  bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    style_id, style_name, brand_id, brand_name, tier,
    resale_median, price_count, live_count, source_count, rep_variant_id
  from style_index_signal_summary;
$$;

grant execute on function style_index_signals() to anon, authenticated;
grant execute on function refresh_style_index_signals() to service_role;

reset statement_timeout;
reset random_page_cost;
reset work_mem;
