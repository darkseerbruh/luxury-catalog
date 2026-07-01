-- Luxury Catalog — variant_price_summary(): per-variant resale price aggregate.
--
-- Why: the homepage "Priced well today" rail (getDeals) and "It bags of all time"
-- canon (getHeroCarousel) compute per-variant resale low/median/high/n + the cheapest
-- current listing. PostgREST caps every response at 1000 rows, so reading the whole
-- ~33k-row price_history into JS either truncates (silent wrong numbers) or pages ~34x
-- per render. This function does the aggregation in Postgres and returns one small row
-- per variant, so each read is a single RPC call.
--
-- Resale population mirrors the JS heuristic (and the 0021 view): everything EXCEPT
-- retail — i.e. exclude explicit retail_msrp and legacy null-type rows on a retail
-- platform. "listed_*" surfaces the cheapest CURRENT asking listing for the deal CTA.
--
-- STABLE + security-invoker: runs under the caller's RLS (price_history already reads
-- with the anon key in-app), recomputed per call (no refresh job, always fresh).

create or replace function variant_price_summary()
returns table (
  variant_id      bigint,
  resale_n        integer,
  resale_low      numeric,
  resale_q25      numeric,
  resale_median   numeric,
  resale_high     numeric,
  listed_low      numeric,
  listed_source   text,
  listed_platform text
)
language sql
stable
as $$
  with resale as (
    select
      ph.variant_id,
      ph.sale_price,
      ph.price_type,
      ph.platform,
      ph.source_url
    from price_history ph
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
    r.variant_id,
    count(*)::integer                                            as resale_n,
    min(r.sale_price)                                            as resale_low,
    percentile_cont(0.25) within group (order by r.sale_price)   as resale_q25,
    percentile_cont(0.5) within group (order by r.sale_price)    as resale_median,
    max(r.sale_price)                                            as resale_high,
    min(r.sale_price) filter (where r.price_type = 'listed')     as listed_low,
    (array_agg(r.source_url order by r.sale_price)
       filter (where r.price_type = 'listed'))[1]                as listed_source,
    (array_agg(r.platform order by r.sale_price)
       filter (where r.price_type = 'listed'))[1]                as listed_platform
  from resale r
  group by r.variant_id;
$$;

grant execute on function variant_price_summary() to anon, authenticated;
