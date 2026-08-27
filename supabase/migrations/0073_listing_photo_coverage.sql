-- Luxury Catalog — make the listing-photo coverage metric mean something.
--
-- WHY (2026-08-27): scripts/data-health.ts derived the platform set from
-- `listing_image.select("platform").limit(1000)` — an UNORDERED 1000-row sample of a
-- table with more rows than that. Two consequences:
--
--   1. NON-DETERMINISTIC. The same query returned {rebag, The Luxury Closet, myGemma} in
--      one call and {myGemma} in the scorecard run minutes later. Postgres is free to
--      return a different 1000 rows each time with no ORDER BY.
--   2. FALSE GREEN. The numerator counted ALL listing_image rows while the denominator
--      counted live listings on the SAMPLED platforms only. With myGemma alone sampled,
--      the ratio blew past 100% and got clamped by Math.min, so the 2026-08-27 report
--      showed "Listing photos (myGemma) 100% green" — a metric that cannot go below
--      green is not a check.
--
-- Fixed by computing both halves in ONE function over the same platform set, so they
-- cannot drift apart. Carries its own statement_timeout for the same reason 0070-0072 do.
--
-- HUMAN-GATED. Superseded: price_history_live_listing_count() from 0071 is now unused by
-- data-health, but left in place — it is correct, cheap, and a reasonable building block.

set statement_timeout = '600s';

-- Platform set, photo count, and live-listing count — all from the same platforms.
create or replace function listing_photo_coverage()
returns table (
  platforms         text[],
  image_count       bigint,
  live_listing_count bigint
)
language sql
stable
security definer
set search_path = public
set statement_timeout = '120s'
as $$
  with plats as (
    select distinct platform from listing_image where platform is not null
  )
  select
    (select array_agg(platform order by platform) from plats),
    (select count(*) from listing_image li
      where li.platform is not null),
    (select count(distinct (lower(ph.platform), ph.listing_ref))
       from price_history ph
      where ph.price_type = 'listed'
        and (ph.listing_status is null or ph.listing_status = 'available')
        and ph.listing_ref is not null
        and lower(ph.platform) in (select lower(platform) from plats));
$$;

grant execute on function listing_photo_coverage() to service_role;

reset statement_timeout;
