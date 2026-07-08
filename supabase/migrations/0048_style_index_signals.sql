-- Luxury Catalog — style_index_signals(): per-style market signals for the LC Index.
--
-- Why: the LC Index (docs/ux/lc-index-spec.md) ranks every style by one blended score
-- built from four measured signals. Three of them are aggregates over price_history that
-- PostgREST cannot group client-side without paging the whole ~57k-row table per render.
-- This function does the aggregation in Postgres and returns one small row per style, so
-- the whole index is one RPC call. The JS engine (src/lib/lc-index.ts) turns these raw
-- signals into percentiles, a composite score, and a rank.
--
-- Signals returned per style:
--   resale_median — the style's price standing (pooled resale prices across its variants).
--   price_count   — trade volume (how many resale prices we have recorded).
--   live_count    — live listings right now (the scarcity source; fewer ranks higher in JS).
--   tier          — the house tier (weighted, not a percentile).
--
-- Resale population mirrors variant_price_summary() / the 0021 view: everything EXCEPT
-- retail. A "live" listing = a real for-sale listing (listing_ref present) not marked sold.
--
-- STABLE + security-invoker: runs under the caller's RLS (price_history already reads with
-- the anon key in-app), recomputed per call so it is always fresh. Degrades safely: if the
-- function is absent the JS falls back to an empty index and the module simply does not render.

create or replace function style_index_signals()
returns table (
  style_id      bigint,
  style_name    text,
  brand_id      bigint,
  brand_name    text,
  tier          text,
  resale_median numeric,
  price_count   integer,
  live_count    integer
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
      ph.sale_price,
      ph.listing_ref,
      ph.listing_status
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
  )
  select
    r.style_id,
    max(r.style_name)                                            as style_name,
    max(r.brand_id)                                              as brand_id,
    max(r.brand_name)                                            as brand_name,
    max(r.tier)                                                  as tier,
    percentile_cont(0.5) within group (order by r.sale_price)    as resale_median,
    count(*)::integer                                            as price_count,
    count(*) filter (
      where r.listing_ref is not null
        and r.listing_status is distinct from 'sold'
    )::integer                                                   as live_count
  from resale r
  group by r.style_id;
$$;

grant execute on function style_index_signals() to anon, authenticated;
