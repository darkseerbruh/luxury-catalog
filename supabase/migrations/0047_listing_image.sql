-- Luxury Catalog: per-listing product photos from affiliate feeds.
--
-- The bag-page "For sale right now" rail shows one live offer per listing; this
-- table gives each a PHOTO, keyed by (platform, listing_ref) so it joins to the
-- price_history rows the rail already renders. First populated by the CJ / The
-- Luxury Closet feed ingest (supabase/ingest/sources/tlc.ts). Images are
-- DISPLAY + LINK-BACK licensed while the listing is live, so this is refreshed
-- every ingest and a sold listing's photo stops being shown (the rail only
-- reads images for live offers).
--
-- Ephemeral display data, NOT price history. The app degrades gracefully if this
-- table is absent: getListingsForVariant (src/lib/listings.ts) catches the
-- missing-table error and renders photo-less cards, and the ingest skips the
-- image upsert — so merging the code before applying this migration never
-- breaks the rail (the owner applies migrations via the GitHub Action).

create table if not exists listing_image (
  platform text not null,
  -- Matches price_history.listing_ref (the seller's stable per-listing id).
  listing_ref text not null,
  -- https product image (the ingest upgrades the feed's http CDN url).
  image_url text not null,
  updated_at timestamptz not null default now(),
  primary key (platform, listing_ref)
);

-- Public, read-only display data (no PII). Anon/authenticated may SELECT; only
-- the service-role ingest writes (it bypasses RLS).
alter table listing_image enable row level security;

drop policy if exists listing_image_public_read on listing_image;
create policy listing_image_public_read on listing_image
  for select using (true);
