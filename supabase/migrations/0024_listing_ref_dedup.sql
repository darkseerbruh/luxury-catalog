-- Luxury Catalog: per-listing dedup fidelity.
--
-- PROBLEM: the 0021 dedup index `price_history_dedup_idx` keys on
--   (variant_id, platform, price_type, observed_on, sale_price)
-- so two GENUINELY DISTINCT resale listings that happen to share the same asking
-- price on the same day collapse into one row (the loader upserts with
-- ignoreDuplicates: true). That under-counts the real market spread.
--
-- FIX: include `listing_ref` (the stable per-listing id/SKU added in 0023) in the
-- dedup key. PostgREST `.upsert({onConflict})` needs the conflict target to be
-- REAL column names — not an expression — so we can't use
-- coalesce(listing_ref, source_url) in the index. Instead, load-prices.ts now
-- populates listing_ref with a deterministic fallback (`o.attrs.listing_ref ??
-- o.source_url`) so it is NEVER null at write time, and the index is a plain
-- column tuple that simply adds listing_ref:
--   (variant_id, platform, price_type, observed_on, sale_price, listing_ref)
-- The loader's onConflict is updated to match. Effect:
--   * distinct resale listings (distinct listing_ref) → distinct rows, no collapse;
--   * non-listing sources (retail_msrp / wayback) carry their source_url as
--     listing_ref, so re-ingesting the same row still dedups idempotently.
--
-- HUMAN-GATED MIGRATION — like 0021–0023, NOT applied or runtime-tested by the
-- authoring session (no Supabase credentials). Apply via GitHub → Actions →
-- "Apply database migrations" → Run workflow (blank input), after 0023. Then the
-- operator/owner RE-RUNS the TheRealReal load so the previously-collapsed rows
-- expand into one row per listing.
--
-- Safe / idempotent: drop-if-exists + create-if-not-exists. Leaves the
-- variant_price_summary view + refresh_variant_price_summary() untouched (this
-- index doesn't feed them).

-- Drop the old (no listing_ref) dedup index.
drop index if exists price_history_dedup_idx;

-- New dedup: adds listing_ref so distinct listings never collapse. listing_ref is
-- now always populated at write time (loader fallback to source_url), so it
-- participates as a real, non-null key for every ingested row.
create unique index if not exists price_history_dedup_idx
  on price_history (variant_id, platform, price_type, observed_on, sale_price, listing_ref);
