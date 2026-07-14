-- Give the variant_price_summary refresh room to finish.
--
-- refresh_variant_price_summary() does a full REFRESH MATERIALIZED VIEW CONCURRENTLY
-- over price_history (now ~138k rows). That rebuild has grown past Supabase's default
-- 8s statement_timeout: the RPC fails with SQLSTATE 57014 ("canceling statement due to
-- statement timeout") even on an idle DB. It hit every ingest workflow's final
-- `summary:refresh` step and the Vercel cron twin (/api/cron/price-summary), both of
-- which call this RPC.
--
-- Scope the longer timeout to THIS function only (SET ... on the function), so the raise
-- applies to the heavy refresh and nothing else. Idempotent create-or-replace; body
-- unchanged from 0021 apart from the added SET.
create or replace function refresh_variant_price_summary()
returns void
language plpgsql
security definer
set search_path = public
set statement_timeout = '180s'
as $$
begin
  refresh materialized view concurrently variant_price_summary;
exception
  when feature_not_supported then
    -- CONCURRENTLY needs a prior populated view; fall back on first run.
    refresh materialized view variant_price_summary;
end;
$$;
