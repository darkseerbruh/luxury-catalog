-- Indexes to keep two scheduled reads under Supabase's ~8s statement_timeout as
-- price_history grows. Both queries time out (SQLSTATE 57014) under the write/vacuum
-- load right after a Fashionphile crawl upserts ~20k rows, even though they run in
-- well under a second on an idle DB. The 0055 fix covered the summary-refresh RPC; these
-- cover the two remaining paths (Daily data health + Fashionphile enrichment).

-- 1. Freshness lookup (scripts/data-health.ts freshnessAge): "newest observed_on for a
--    platform". Existing indexes either lead with variant_id (0021/0024, so the
--    platform-only filter can't use them) or omit observed_on (0030), forcing a heap
--    fetch of every Fashionphile row (~20k) followed by a sort. A (platform, observed_on)
--    btree makes it a single index-range read: filter by platform, already ordered.
create index if not exists price_history_platform_observed_idx
  on price_history (platform, observed_on desc);

-- 2. Ungraded-listing cursor scan (supabase/ingest/grade-condition-fashionphile.ts):
--    paginates by price_id over Fashionphile rows that are still null-condition and
--    available. Partial index on the hot slice keeps it tiny (rows leave the index the
--    moment they're graded) and serves both the filter and the price_id ordering.
create index if not exists price_history_ungraded_fp_idx
  on price_history (platform, price_id)
  where condition is null and listing_status = 'available';
