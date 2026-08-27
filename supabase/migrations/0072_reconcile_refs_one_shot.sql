-- Luxury Catalog — replace 0071's paged reconcile function, which was slower than the
-- thing it replaced.
--
-- WHAT WENT WRONG (2026-08-27, measured right after 0071 landed): keyset-paging over a
-- GROUP BY re-runs the ENTIRE aggregate on every page and then throws away all but the
-- 1000 rows past the cursor. So the cost is one full aggregate PER PAGE, not per walk:
--
--   Fashionphile  6,823 refs / 7 pages / 194.6s   (worst page 58,604ms)
--   Rebag         page 1 failed at 120,183ms, hitting the function's own timeout
--
-- 0071's own price_history_live_listing_count() is the proof that a SINGLE aggregate pass
-- is cheap: 28,408 distinct listings across three platforms in 17.4s. The scan was never
-- the problem. The paging was.
--
-- THE FIX: one call, one pass, no cursor. The 1000-row PostgREST cap is what pushed 0071
-- into paging in the first place, so return a single jsonb value instead of a table — one
-- row, so the cap cannot truncate it. Rebag's ~18,800 refs land around 400KB, which is a
-- normal response body.
--
-- The function keeps its own statement_timeout, which is the part of 0071 that was right:
-- reconcile runs straight after the crawl's write burst, and PostgREST's hard ~8s ceiling
-- is what no index can raise.
--
-- HUMAN-GATED. 0071's reconcile_available_listings() is dropped here rather than left
-- around: it was never wired into main (its caller is still on a branch), so nothing
-- depends on it, and leaving a known-slow function in the schema invites a future caller.
-- 0071's index and price_history_live_listing_count() both stay — those are fine.

set statement_timeout = '600s';

drop function if exists reconcile_available_listings(text[], text, int);

-- Every DISTINCT live listing for the given platforms, newest observation each, as a
-- single jsonb array of {platform, listing_ref, last_seen} objects.
create or replace function reconcile_live_listings(p_platforms text[])
returns jsonb
language sql
stable
security definer
set search_path = public
set statement_timeout = '180s'
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'platform',    t.platform,
      'listing_ref', t.listing_ref,
      'last_seen',   t.last_seen
    )),
    '[]'::jsonb
  )
  from (
    select
      ph.platform,
      ph.listing_ref,
      max(ph.observed_on) as last_seen
    from price_history ph
    where ph.price_type = 'listed'
      and (ph.listing_status is null or ph.listing_status = 'available')
      and ph.platform = any(p_platforms)
      and ph.listing_ref is not null
    group by ph.platform, ph.listing_ref
  ) t;
$$;

grant execute on function reconcile_live_listings(text[]) to service_role;

reset statement_timeout;
