-- Luxury Catalog: live-vs-sold status for resale listings.
--
-- WHY: the Shop aggregates live marketplace listings (price_type='listed') from
-- Fashionphile / TheRealReal / Vestiaire, but nothing ever retired one once it
-- sold or was pulled at the source. With periodic re-crawling now enabled, two
-- problems appear: (1) sold bags linger on the Shop forever, and (2) a listing
-- re-observed on N crawl dates becomes N rows. This migration adds the status
-- the reconcile step stamps so the Shop can show only what's truly for sale.
--
--   * listing_status — 'available' (currently for sale) or 'sold' (gone at source,
--     stamped by supabase/ingest/reconcile-sold.ts when a crawl no longer sees it).
--     NULL = legacy / non-listing rows (sold/auction/retail_msrp facts) — treated
--     as "show it" by the reader, so nothing disappears before a reconcile runs.
--   * delisted_on — the crawl date we first noticed it gone (provenance; lets us
--     report "sold within the last N days" and audit a reconcile run).
--
-- HUMAN-GATED MIGRATION — like 0021–0029, NOT applied or runtime-tested by the
-- authoring session (no Supabase credentials). Apply via GitHub → Actions →
-- "Apply database migrations" → Run workflow (blank input), after 0029.
--
-- Additive + nullable, so the app keeps working before it is applied:
--   * new columns are nullable → existing inserts/seeds unaffected;
--   * the loader starts stamping 'available' on listed rows once applied;
--   * the Shop reader degrades gracefully if the columns are absent (its read is
--     wrapped so a missing column yields an empty result, never an error).

alter table price_history add column if not exists listing_status text;
alter table price_history add column if not exists delisted_on date;

comment on column price_history.listing_status is
  'Live-vs-sold state for resale listings: available (currently for sale) or sold '
  '(no longer seen at source; stamped by reconcile-sold.ts). NULL = legacy/non-listing row.';
comment on column price_history.delisted_on is
  'Crawl date a listing was first noticed gone (set with listing_status=sold). NULL while available.';

-- The Shop reads only currently-available listings; index the live slice so that
-- filter stays cheap as sold rows accumulate. Partial on the hot value.
create index if not exists price_history_available_idx
  on price_history (variant_id)
  where listing_status = 'available';

-- Reconcile scans available rows per platform; support that lookup directly.
create index if not exists price_history_status_platform_idx
  on price_history (platform, listing_status, listing_ref);
