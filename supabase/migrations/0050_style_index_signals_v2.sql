-- Luxury Catalog — style_index_signals() v2: honest per-style medians for the LC Index.
--
-- Supersedes 0048 (never edit 0048; it is applied). Same signature, corrected aggregation.
--
-- WHY v2 (diagnosed against prod 2026-07-08, scripts/diagnose-lc-index.ts):
--   The v1 median/counts were contaminated by DUPLICATE listing observations. price_history
--   records the SAME live listing many times (re-scraped over days), keyed by listing_ref.
--   v1 took percentile_cont / count(*) over every raw row, so a style's median was weighted by
--   how often each listing was re-observed, and price_count/live_count were inflated. Example:
--   Kelly Pochette showed 53 "prices" from only 15 unique listings (3.5x), and its exotic
--   listings were re-observed most, dragging the median to $20,995 — above the Birkin, which is
--   impossible. Birkin/Kelly were ~1.9x inflated. This ranked a pochette #1.
--
--   The doc's prime suspect was mixed currencies pooled unconverted. Verified: prod is 100% USD
--   today, so currency was NOT the active bug. We still filter to each style's DOMINANT currency
--   before the median as a guard, so a future EUR/GBP ingest can never recontaminate it. It is a
--   no-op on today's all-USD data.
--
-- THE FIX, in two steps:
--   1. DEDUPE to one row per (style, listing_ref), keeping the LATEST observation
--      (observed_on, then date_recorded, then price_id). Rows with a null listing_ref are each
--      their own listing (keyed by price_id), so genuine distinct comps are never merged.
--   2. Aggregate over the deduped rows, restricted to the style's dominant currency:
--        resale_median — median of one price per distinct listing (no re-observation weighting).
--        price_count   — count of distinct listings (real market activity, not scrape frequency).
--        live_count    — distinct listings whose latest status is not 'sold' (the scarcity source).
--
-- Resale population unchanged from 0048: everything EXCEPT retail. STABLE, security-invoker,
-- recomputed per call. Degrades safely to an empty index if absent.

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
  -- A null listing_ref is treated as its own distinct listing (keyed by price_id).
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
      r.listing_status
    from resale r
    order by
      r.style_id,
      coalesce(r.listing_ref, '__pid_' || r.price_id),
      r.observed_on   desc nulls last,
      r.date_recorded desc nulls last,
      r.price_id      desc
  ),
  -- The dominant currency per style = the one with the most distinct listings.
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
    min(d.variant_id)::bigint                                             as rep_variant_id
  from deduped d
  left join dom_cur dc on dc.style_id = d.style_id
  group by d.style_id, dc.currency;
$$;

grant execute on function style_index_signals() to anon, authenticated;
