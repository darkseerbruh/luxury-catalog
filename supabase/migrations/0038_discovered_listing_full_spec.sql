-- Luxury Catalog: carry the FULL captured spec through the discovered_listing tier.
--
-- The capture pipeline now extracts region (marketplace country), a per-listing
-- condition write-up, a first-listed date + was-price (in `enrichment`) from the
-- resale feeds. price_history already has columns for these (migrations 0021-0023);
-- discovered_listing (0026) did not, so the loader's toDiscovered() was silently
-- dropping them at the catch-all tier. This adds the matching columns so the
-- discovered tier loses nothing the curated tier keeps, and promote-safe can carry
-- them up into price_history when a cluster is promoted.
--
-- Idempotent (add column if not exists). Apply via GitHub -> Actions ->
-- "Apply database migrations". Until applied, load-prices.ts strips these keys on a
-- 42703 and loads the rest, so merging ahead of the apply never breaks a load.

alter table discovered_listing add column if not exists region          text;
alter table discovered_listing add column if not exists condition_detail text;
alter table discovered_listing add column if not exists enrichment       jsonb;

comment on column discovered_listing.region is 'Listing/marketplace region (e.g. "US") for cross-currency comparison fairness.';
comment on column discovered_listing.condition_detail is 'Per-listing condition write-up (facts only; never the reseller''s generic grade-definition prose).';
comment on column discovered_listing.enrichment is 'Structured sub-signals: listed_at (first-published date), compare_at_price (was-price), LLM condition sub-signals.';
