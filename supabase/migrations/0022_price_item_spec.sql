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

alter table price_history add column colorway text;
alter table price_history add column material text;
alter table price_history add column hardware_color text;
alter table price_history add column production_year integer;
alter table price_history add column season text;

comment on column price_history.colorway is 'Exterior colour of the specific listing (e.g. Black, Beige), for spec-level resale pricing.';
comment on column price_history.material is 'Leather/material of the listing (e.g. Caviar Leather, Lambskin).';
comment on column price_history.hardware_color is 'Hardware tone of the listing (gold, silver, ruthenium…).';
comment on column price_history.production_year is 'Production/collection start year parsed from the listing.';
comment on column price_history.season is 'Collection/season label (e.g. "2011-2012") when stated.';

-- Helps the per-spec grouping queries the bag page will run.
create index price_history_spec_idx
  on price_history (variant_id, colorway, material, hardware_color);
