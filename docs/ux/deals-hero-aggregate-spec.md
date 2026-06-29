# Spec: move "Priced well today" + "It bags" price math into the DB (owner-gated migration)

*Written 2026-06-29. Status: PROPOSAL, owner applies the migration via the db-migrate Action.*

## Why

Both homepage modules compute their numbers in JS over the whole `price_history` table:

- `getDeals()` ([src/lib/deals.ts](../../src/lib/deals.ts)) reads every resale row (~33.5k) to find, per variant, the lowest current listing vs the resale median.
- `getHeroCarousel()` ([src/lib/queries.ts](../../src/lib/queries.ts)) reads every resale row for the 6 canon styles' variants.

PostgREST caps every response at **1,000 rows** regardless of `.limit()`. We currently work around that with `fetchAllRows()` ([src/lib/supabase.ts](../../src/lib/supabase.ts)), which **pages the whole table (~34 requests) on every homepage render**. Correct, but a full-table scan per dynamic render. The proper fix is to let Postgres do the aggregation and return a small result.

## What (recommended: one RPC, computed server-side)

A SQL function that returns one row per variant with the price summary the app needs. Aggregates run in Postgres over the full table and return ~hundreds of rows (under the cap, one round trip).

```sql
-- migration 00NN_variant_price_summary_fn.sql  (NUMBER ANNOUNCED AT APPLY TIME)
create or replace function variant_price_summary()
returns table (
  variant_id      bigint,
  resale_n        int,
  resale_low      numeric,
  resale_median   numeric,
  resale_high     numeric,
  -- the cheapest CURRENT listing + where it lives, for the deal CTA:
  listed_low      numeric,
  listed_source   text,
  listed_platform text
)
language sql stable as $$
  with resale as (        -- mirror the JS "not retail" rule (0021 heuristic)
    select variant_id, sale_price, price_type, platform, source_url
    from price_history
    where sale_price is not null and sale_price > 0
      and not (price_type = 'retail_msrp'
               or (price_type is null and platform ~* 'retail|boutique|msrp|in[- ]?store|flagship'))
  )
  select
    r.variant_id,
    count(*)                                              as resale_n,
    min(r.sale_price)                                     as resale_low,
    percentile_cont(0.5) within group (order by r.sale_price) as resale_median,
    max(r.sale_price)                                     as resale_high,
    min(r.sale_price) filter (where r.price_type = 'listed')  as listed_low,
    (array_agg(r.source_url order by r.sale_price)
       filter (where r.price_type = 'listed'))[1]         as listed_source,
    (array_agg(r.platform order by r.sale_price)
       filter (where r.price_type = 'listed'))[1]         as listed_platform
  from resale r
  group by r.variant_id;
$$;
```

(Plus `grant execute ... to anon, authenticated;`. Add `condition` aggregation once the condition backfill lands, see the data worklist, so the verdict can become condition-aware.)

## App changes (after the migration applies)

- `getDeals()`: `select * from variant_price_summary()` via `getSupabase().rpc(...)`; in JS filter to `listed_low < resale_median`, apply the existing sanity guard (`MAX_DEAL_PCT_UNDER`), rank by gap, slice. One round trip, no `fetchAllRows`.
- `getHeroCarousel()`: join the 6 canon styles' variants to the RPC rows, aggregate per style (or add a per-style overload). Keep the curated hooks + ranking in code.
- Then **delete the `fetchAllRows` pager** from both reads (keep the helper if used elsewhere; today only these two use it).

## Rollout

1. Owner applies the migration (announce the number first, per parallel-sessions rules).
2. Switch the two reads to the RPC behind the existing resilient-`[]`-on-error contract.
3. Verify the rail + canon render identical numbers (they should match the current paged result), then remove the pager calls.

## Alternative considered

A **materialized view** (refresh on ingest / cron) is marginally faster but adds refresh-staleness and a refresh job; a plain `stable` function is fresh-on-read and fast enough at this table size. Start with the function; promote to a matview only if the homepage TTFB needs it.

## Not doing

Per-variant caching in the app layer (kicks the can; the scan still happens). The DB is the right place for this aggregation.
