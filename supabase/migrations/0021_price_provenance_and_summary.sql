-- Luxury Catalog: price provenance + derived fair-market summary.
--
-- Adds the columns the multi-source price-ingestion pipeline needs (see
-- docs/data-sourcing-research.md): a source URL for attribution/link-back, a
-- signal-type discriminator (listed vs sold vs auction vs retail MSRP vs
-- estimate), the date a price was true *at source* (distinct from when we
-- ingested it), and a confidence level. Then builds a per-variant
-- `variant_price_summary` materialized view (low/median/high resale,
-- last-sold, retail-vs-resale retention) so bag pages read one row instead of
-- aggregating price_history on the fly.
--
-- HUMAN-GATED MIGRATION — like 0007–0020, NOT applied or runtime-tested by the
-- authoring session (no Supabase credentials). Apply after 0020. Additive +
-- nullable, so the app keeps working before it is applied:
--   * new columns are nullable → existing inserts/seeds unaffected;
--   * the summary view is new → nothing reads it until the bag page is wired.
--
-- Catalog tables (brand/style/variant/price_history) have no RLS — they are
-- public-read. The materialized view follows suit (explicit grant below).

-- ── 1. Signal-type enum ──────────────────────────────────────────────────────
create type price_type as enum ('listed', 'sold', 'auction', 'retail_msrp', 'estimate');

-- ── 2. price_history provenance columns ──────────────────────────────────────
alter table price_history add column source_url text;
alter table price_history add column price_type price_type;
alter table price_history add column observed_on date;
alter table price_history add column confidence_level confidence_level;

comment on column price_history.source_url is
  'Attribution / link-back URL the price was read from. Required for ingested rows; also the dedup key.';
comment on column price_history.price_type is
  'Signal type: listed (current resale), sold (eBay realized), auction (auction-house realized), retail_msrp (brand retail), estimate.';
comment on column price_history.observed_on is
  'Date the price was true at the source (e.g. auction sale date, Wayback capture date). Distinct from date_recorded (ingest date).';

-- Dedup: one row per (variant, platform, signal, observed date, price). NULLs are
-- distinct in Postgres unique indexes, so legacy rows (null price_type/observed_on)
-- never collide. Lets the loader upsert idempotently on re-run.
create unique index price_history_dedup_idx
  on price_history (variant_id, platform, price_type, observed_on, sale_price);

-- ── 3. Per-variant fair-market summary ───────────────────────────────────────
-- Resale rows = explicit resale price_types, plus legacy rows (null price_type)
-- that don't look like retail/boutique listings (mirrors the heuristic in
-- src/lib/queries.ts so pre-0021 seeded data is still counted).
create materialized view variant_price_summary as
with resale as (
  select
    variant_id,
    sale_price,
    currency,
    price_type,
    coalesce(observed_on, date_recorded) as eff_date
  from price_history
  where sale_price is not null
    and (
      price_type in ('listed', 'sold', 'auction')
      or (
        price_type is null
        and (platform is null or platform !~* 'retail|boutique|msrp|in[-\s]?store|flagship')
      )
    )
),
agg as (
  select
    variant_id,
    min(sale_price)                                                as resale_low,
    percentile_cont(0.5) within group (order by sale_price)        as resale_median,
    max(sale_price)                                                as resale_high,
    count(*)                                                       as sample_size,
    mode() within group (order by currency)                       as resale_currency
  from resale
  group by variant_id
),
last_sold as (
  select distinct on (variant_id)
    variant_id,
    sale_price as last_sold_price,
    eff_date   as last_sold_on
  from resale
  where price_type in ('sold', 'auction')
  order by variant_id, eff_date desc
)
select
  v.variant_id,
  v.retail_price_original                                          as retail_current,
  a.resale_low,
  a.resale_median,
  a.resale_high,
  coalesce(a.sample_size, 0)                                       as sample_size,
  coalesce(a.resale_currency, v.currency)                          as currency,
  ls.last_sold_price,
  ls.last_sold_on,
  case
    when v.retail_price_original is not null
     and v.retail_price_original > 0
     and a.resale_median is not null
    then round((a.resale_median / v.retail_price_original * 100)::numeric, 1)
  end                                                              as retention_pct,
  now()                                                            as as_of
from variant v
left join agg a       on a.variant_id = v.variant_id
left join last_sold ls on ls.variant_id = v.variant_id;

-- Unique index → enables REFRESH MATERIALIZED VIEW CONCURRENTLY (no read lock).
create unique index variant_price_summary_variant_idx
  on variant_price_summary (variant_id);

grant select on variant_price_summary to anon, authenticated;

-- Refresh entry point for the cron (/api/cron/price-summary) — callable via
-- supabase.rpc('refresh_variant_price_summary'). SECURITY DEFINER so the
-- service role can refresh regardless of object ownership.
create or replace function refresh_variant_price_summary()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently variant_price_summary;
exception
  when feature_not_supported then
    -- CONCURRENTLY needs a prior populated view; fall back on first run.
    refresh materialized view variant_price_summary;
end;
$$;
