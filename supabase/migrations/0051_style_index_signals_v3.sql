-- Luxury Catalog — style_index_signals() v3: add a distinct-source count per style.
--
-- Supersedes 0050 (never edit 0050/0048; they are applied). Same aggregation as v2
-- (dedupe by listing_ref, dominant-currency median), plus one new column: source_count.
--
-- WHY (owner review 2026-07-08): v2 fixed the *quantity* floor but not *independence*.
-- 31% of ranked styles sat on a single reseller (e.g. Coco Base Shopping Bag and
-- Souplissimo Maxi Flap, ~33-42 listings all Fashionphile). A market-STANDING rank built
-- on one merchant is that merchant's asking price, not the market's. The JS engine now
-- also gates on "seen by >= 2 sources" (LC_INDEX_MIN_SOURCES), so it needs the count.
--
-- source_count = distinct platforms among a style's DEDUPED, dominant-currency listings.
-- Platform labels are normalised (lower-case, spaces stripped) so "The RealReal" /
-- "TheRealReal" and "ebay" / "eBay" each count once. Null-platform rows are ignored for
-- the source count (they carry no provenance).
--
-- Adding a column to the RETURNS TABLE changes the function's return type, which
-- CREATE OR REPLACE cannot do (SQLSTATE 42P13). Drop first, then recreate. The grant
-- below restores anon/authenticated execute after the recreate.

drop function if exists style_index_signals();

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
as $$
  with resale as (
    select
      s.style_id,
      s.name        as style_name,
      b.brand_id,
      b.name        as brand_name,
      b.tier,
      v.variant_id,
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
    join style   s on s.style_id   = v.style_id
    join brand   b on b.brand_id   = s.brand_id
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
      r.style_name,
      r.brand_id,
      r.brand_name,
      r.tier,
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
  )
  select
    d.style_id,
    max(d.style_name)   as style_name,
    max(d.brand_id)     as brand_id,
    max(d.brand_name)   as brand_name,
    max(d.tier)         as tier,
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
  group by d.style_id, dc.currency;
$$;

grant execute on function style_index_signals() to anon, authenticated;
