-- Luxury Catalog: condition / inclusions / region / listing-id + enrichment on
-- resale price rows. (These were originally appended to 0022, but 0022 had already
-- been applied to production, so Supabase would never re-run it — hence this
-- separate migration. IF NOT EXISTS guards keep it a no-op on fresh installs where
-- 0022 might already define them.)
--
-- Unlocks the condition ladder, full-set vs bag-only swing, cross-currency
-- fairness, and first-seen / days-on-market tracking (see docs viz requirements,
-- Tier 2). HUMAN-GATED — apply via the one-button GitHub Action after 0022.

alter table price_history add column if not exists condition_detail text;   -- full wear/condition write-up
alter table price_history add column if not exists inclusions text;         -- "Dust Bag, Authenticity Card" (full-set signal)
alter table price_history add column if not exists region text;             -- marketplace/listing region (cross-currency fairness)
alter table price_history add column if not exists listing_ref text;        -- stable per-listing id (SKU) for first-seen / days-on-market
alter table price_history add column if not exists enrichment jsonb;        -- LLM-extracted sub-signals (corner wear, tarnish, repaint…)

comment on column price_history.condition_detail is 'Full condition/wear description from the listing (raw text; LLM-enrichable).';
comment on column price_history.inclusions is 'What the listing includes (box/dust bag/card/receipt) — full-set vs bag-only swing.';
comment on column price_history.region is 'Listing/marketplace region for cross-currency comparison fairness.';
comment on column price_history.listing_ref is 'Stable listing id (e.g. reseller SKU) to track first-seen date & days-on-market across snapshots.';
comment on column price_history.enrichment is 'Structured sub-signals extracted later (e.g. {"corner_wear":"minor","hardware_tarnish":false}).';

-- First-seen / days-on-market tracking keys on the stable listing id.
create index if not exists price_history_listing_ref_idx
  on price_history (listing_ref) where listing_ref is not null;
