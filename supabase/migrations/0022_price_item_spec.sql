-- Luxury Catalog: per-listing trim/spec on resale price rows.
--
-- Resale value is highly spec-specific — one colour can fetch 2x another in the
-- same leather/season — so a blended "fair-market range" per size is misleading.
-- This lets each resale observation carry the exact colour / leather / hardware /
-- production year it was for, so bag pages can show price by spec.
--
-- HUMAN-GATED MIGRATION — applied via the one-button GitHub Action. Additive +
-- nullable. (Condition/inclusions/region/SKU/enrichment fields are added in 0023;
-- they were appended to this file after it had already been applied, so they had
-- to move to their own migration.)

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
