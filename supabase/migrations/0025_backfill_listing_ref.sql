-- Luxury Catalog: backfill listing_ref on legacy rows (companion to 0024).
--
-- PROBLEM: 0024 made listing_ref part of the dedup unique index, and
-- load-prices.ts now ALWAYS writes listing_ref (falling back to source_url when a
-- source has no per-listing id). But rows ingested BEFORE 0024 have
-- listing_ref = NULL. In a Postgres unique index NULLs are DISTINCT, so a legacy
-- NULL-listing_ref row will NOT collide with the same row re-ingested today
-- (which now carries listing_ref = source_url) → re-ingest would create a
-- DUPLICATE instead of deduping.
--
-- FIX: backfill the legacy rows to exactly what the loader now writes — set
-- listing_ref = source_url wherever listing_ref IS NULL and source_url is
-- present. After this, a re-ingest of any legacy ingested row dedups cleanly.
--
-- Rows with NO source_url (e.g. very old pre-pipeline seed data) are left NULL:
-- they have no deterministic key and aren't produced by the ingestion loader, so
-- they're not a re-ingest duplication risk.
--
-- IDEMPOTENT: re-running is a no-op once the legacy NULLs are filled. HUMAN-GATED
-- like 0021–0024 — apply via GitHub → Actions → "Apply database migrations" →
-- Run workflow (blank input), AFTER 0024 and BEFORE re-running the TheRealReal
-- load. Leaves the variant_price_summary view untouched (listing_ref isn't in it).

update price_history
set listing_ref = source_url
where listing_ref is null
  and source_url is not null;
