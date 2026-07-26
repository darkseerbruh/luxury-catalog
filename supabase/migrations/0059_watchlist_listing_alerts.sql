-- 0059_watchlist_listing_alerts.sql
-- Availability alerts: tell a watcher when one turns up AT ALL.
--
-- Both existing alert modes are price-conditioned ('absolute' needs a dollar
-- target, 'pct_below_median' needs a median), and pct_below_median returns null
-- below 5 comps. As of 2026-07-26 that left 690 of 4,409 summarised variants
-- (15.6%) unable to fire an alert at all, 417 of them with zero comps
-- (scripts/probe-alert-coverage.ts). Those are precisely the rare bags a
-- collector watches, so the alert was dead exactly where the catalogue is most
-- differentiated.
--
-- The fix is a FLOOR, not a third mode (owner call, 2026-07-25): every watched
-- bag pings you when a listing appears, and whatever price rule you set sits on
-- top. A collector who also set a price target still wants to know a grail
-- surfaced.
--
-- Default ON for existing rows: a watch already means "tell me about this bag",
-- and the separate clock below guarantees nobody gets a retroactive flood.

-- The notification feed is typed by an enum (0003), so the new kind has to be
-- declared before anything can insert one. Same pattern as 0007.
alter type notification_type add value if not exists 'listing_alert';

alter table watchlist
  -- The floor. Users can turn it off per watch.
  add column if not exists notify_on_listing boolean not null default true,
  -- Deliberately SEPARATE from last_notified_at: a price-drop ping must not
  -- suppress an availability ping (or vice versa), and back-filling this as
  -- NULL means the first run only considers listings newer than the watch
  -- itself, never the whole history.
  add column if not exists last_listing_notified_at timestamptz;

-- Serves the alert job's "available listings for these variants, newest first"
-- read. Partial, so rows leave the index the moment reconcile-sold stamps them
-- 'sold', and the ORDER BY column is in the index too (a bare filter index
-- still tipped past the 8s statement timeout on price_history before).
create index if not exists price_history_available_variant_observed_idx
  on price_history (variant_id, observed_on desc)
  where listing_status = 'available';
