-- Luxury Catalog: the "discovered listing" raw layer (catalog backbone §5, model B).
--
-- GOAL: "every bag ever made." The curated catalog (brand → style → variant) is kept
-- intentionally CLEAN and top-down (the permanent-collection backbone). But the price
-- loader currently DROPS any captured listing it can't resolve to a curated variant
-- (no brand match, no style match, or — most often — a real style with no matching
-- size/colour variant). That silently discards genuine market data.
--
-- FIX (two-tier): a raw `discovered_listing` table captures everything the loader
-- can't place, WITHOUT polluting the curated catalog. Each row keeps the parsed
-- per-listing spec (colour / material / hardware / year / price / source_url) plus the
-- best partial match we did get (matched_brand_id / matched_style_id) and the raw
-- listing title, so a later NORMALIZATION/PROMOTION pass can roll recurring models up
-- into curated styles/variants over time. Nothing is lost; the clean catalog stays clean.
--
-- The loader (load-prices.ts) writes here on the unresolved branch when --write is set.
-- It degrades gracefully: if this migration has not been applied yet, the insert hits
-- "relation does not exist" (42P01) and the loader just logs + counts (today's behaviour),
-- so merging the loader change never breaks a load before the migration lands.
--
-- HUMAN-GATED MIGRATION — like 0021–0025, NOT applied or runtime-tested by the authoring
-- session (no Supabase credentials in the worktree). Apply via GitHub → Actions →
-- "Apply database migrations" → Run workflow, AFTER this file is on `main`. Then re-run
-- the resale loads and the previously-dropped listings will land in discovered_listing.
--
-- Safe / idempotent: create-if-not-exists throughout.

create table if not exists discovered_listing (
  discovered_id      bigint generated always as identity primary key,

  -- where it came from
  platform           text not null,
  listing_ref        text not null,             -- stable per-listing id/slug (dedup key)
  source_url         text,
  raw_name           text,                      -- the listing title, verbatim (for promotion)

  -- best-effort identity (text guesses always present; ids set when partially resolved)
  brand_guess        text,
  style_guess        text,
  matched_brand_id   bigint references brand (brand_id) on delete set null,
  matched_style_id   bigint references style (style_id) on delete set null,

  -- parsed per-listing spec (same shape as price_history's resale columns)
  size_label         text,
  colorway           text,
  material           text,
  hardware_color     text,
  production_year    integer,
  season             text,
  inclusions         text,

  -- the price signal
  price_type         text not null default 'listed',
  sale_price         numeric(12, 2) not null,
  currency           text not null default 'USD',
  condition          text,

  -- why it wasn't placed, for triage: 'no_brand' | 'no_style' | 'no_variant'
  unresolved_reason  text,

  observed_on        date not null,
  captured_at        timestamptz not null default now(),

  -- set by the promotion pass once this listing's model is rolled into the catalog
  promoted_variant_id bigint references variant (variant_id) on delete set null,
  promoted_at        timestamptz
);

-- Dedup: one row per distinct listing per day per asking price (mirrors the
-- price_history dedup philosophy so re-running a capture is idempotent).
create unique index if not exists discovered_listing_dedup_idx
  on discovered_listing (platform, listing_ref, observed_on, sale_price);

-- Triage / promotion lookups.
create index if not exists discovered_listing_unpromoted_idx
  on discovered_listing (matched_style_id) where promoted_variant_id is null;
create index if not exists discovered_listing_brand_idx
  on discovered_listing (matched_brand_id);
