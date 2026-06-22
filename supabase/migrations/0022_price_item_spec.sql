-- Luxury Catalog: per-listing spec on resale price rows.
--
-- Resale value is highly spec-specific — one colour can fetch 2x another in the
-- same leather/season — so a blended "fair-market range" per size is misleading.
-- This lets each resale observation carry the exact colour / leather / hardware /
-- production year it was for, so bag pages can show price by spec (e.g.
-- "Black caviar / gold: $X-$Y") instead of generalising. Captured from reseller
-- product pages (see src/lib/ingest/trr.ts).
--
-- HUMAN-GATED MIGRATION — like 0007–0021, NOT applied by the authoring session.
-- Apply after 0021 (one-button GitHub Action "Apply database migrations").
-- Additive + nullable, so nothing breaks before it is applied or for existing rows.

-- Trim/spec (what makes resale like-for-like):
alter table price_history add column colorway text;
alter table price_history add column material text;
alter table price_history add column hardware_color text;
alter table price_history add column production_year integer;
alter table price_history add column season text;
-- Condition, inclusions, provenance & listing metadata (Tier 2 extraction):
alter table price_history add column condition_detail text;     -- full wear/condition write-up
alter table price_history add column inclusions text;           -- "Dust Bag, Authenticity Card" (full-set signal)
alter table price_history add column region text;               -- marketplace/listing region (cross-currency fairness)
alter table price_history add column listing_ref text;          -- stable per-listing id (SKU) for first-seen / days-on-market
-- Flexible bucket for LLM-extracted sub-signals (corner wear, tarnish, repaint…):
alter table price_history add column enrichment jsonb;

comment on column price_history.colorway is 'Exterior colour of the specific listing (e.g. Black, Beige), for spec-level resale pricing.';
comment on column price_history.material is 'Leather/material of the listing (e.g. Caviar Leather, Lambskin).';
comment on column price_history.hardware_color is 'Hardware tone of the listing (gold, silver, ruthenium…).';
comment on column price_history.production_year is 'Production/collection start year parsed from the listing.';
comment on column price_history.season is 'Collection/season label (e.g. "2011-2012") when stated.';
comment on column price_history.condition_detail is 'Full condition/wear description from the listing (raw text; LLM-enrichable).';
comment on column price_history.inclusions is 'What the listing includes (box/dust bag/card/receipt) — full-set vs bag-only swing.';
comment on column price_history.region is 'Listing/marketplace region for cross-currency comparison fairness.';
comment on column price_history.listing_ref is 'Stable listing id (e.g. reseller SKU) to track first-seen date & days-on-market across snapshots.';
comment on column price_history.enrichment is 'Structured sub-signals extracted later (e.g. {"corner_wear":"minor","hardware_tarnish":false}).';

-- Helps the per-spec grouping queries the bag page will run.
create index price_history_spec_idx
  on price_history (variant_id, colorway, material, hardware_color);
-- First-seen / days-on-market tracking keys on the stable listing id.
create index price_history_listing_ref_idx
  on price_history (listing_ref) where listing_ref is not null;
