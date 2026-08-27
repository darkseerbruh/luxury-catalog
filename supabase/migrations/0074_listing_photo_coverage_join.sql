-- Luxury Catalog — make listing-photo coverage an actual coverage fraction.
--
-- WHY (2026-08-27): 0073 fixed the metric's non-determinism but not its shape. It still
-- divided ALL listing_image rows by the count of live listings, which are two different
-- populations: listing_image keeps a row after its listing sells, so the numerator counts
-- photos for dead listings the denominator no longer contains. Measured right after 0073
-- landed: 44,656 photos / 28,408 live listings = 157.2%, clamped to 100% by Math.min.
--
-- A coverage number that can exceed 100% is not a coverage number, and clamping it means
-- the check reads green whether photo ingest is perfect or merely mediocre.
--
-- The question the metric is actually asking is "what share of our LIVE listings can we
-- show a photo for", so join the two sets on (platform, listing_ref) — the natural key,
-- and listing_image's own primary key — and count the live ones that match. Bounded to
-- 0-100 by construction, no clamp needed.
--
-- Case-insensitive join because listing_image stores 'rebag' where price_history stores
-- 'Rebag' (found 2026-08-27; the old exact-match count silently returned 0 for Rebag).
--
-- HUMAN-GATED.
--
-- DROP first: this changes the return type (image_count -> with_photo_count), and
-- `create or replace function` cannot do that — it fails with 42P13, which is exactly how
-- the first attempt at this migration died. Nothing outside data-health calls it.

set statement_timeout = '600s';

drop function if exists listing_photo_coverage();

create or replace function listing_photo_coverage()
returns table (
  platforms          text[],
  live_listing_count bigint,
  with_photo_count   bigint
)
language sql
stable
security definer
set search_path = public
set statement_timeout = '120s'
as $$
  with plats as (
    select distinct lower(platform) as platform_l, platform
    from listing_image
    where platform is not null
  ),
  live as (
    select distinct lower(ph.platform) as platform_l, ph.listing_ref
    from price_history ph
    where ph.price_type = 'listed'
      and (ph.listing_status is null or ph.listing_status = 'available')
      and ph.listing_ref is not null
      and lower(ph.platform) in (select platform_l from plats)
  ),
  imgs as (
    select distinct lower(platform) as platform_l, listing_ref
    from listing_image
    where platform is not null
  )
  select
    (select array_agg(distinct platform order by platform) from plats),
    count(*),
    count(i.listing_ref)
  from live l
  left join imgs i
    on i.platform_l = l.platform_l
   and i.listing_ref = l.listing_ref;
$$;

grant execute on function listing_photo_coverage() to service_role;

reset statement_timeout;
