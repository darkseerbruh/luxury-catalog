-- 0033_alert_pct_below_median.sql
-- Percent-below-median price alerts.
--
-- A new user has no idea what dollar figure to type, but they know they want a
-- deal. So the default alert rule becomes "tell me when a bag drops to X% below
-- the typical resale price" (median, not average: resale prices are right-skewed,
-- so the median fires fewer, truer-deal alerts). The raw-dollar target stays
-- available as the 'absolute' mode for power users.
--
-- Existing rows keep their exact behavior: alert_mode defaults to 'absolute', so
-- their target_price rule is unchanged. New watches default to 'pct_below_median'.
-- The app degrades gracefully until this is applied (reads/writes fall back to the
-- legacy target_price columns), so merging this does not break the live app.

alter table watchlist
  add column if not exists alert_mode text not null default 'absolute',
  add column if not exists alert_pct integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'watchlist_alert_mode_chk') then
    alter table watchlist
      add constraint watchlist_alert_mode_chk
      check (alert_mode in ('absolute', 'pct_below_median')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'watchlist_alert_pct_chk') then
    alter table watchlist
      add constraint watchlist_alert_pct_chk
      check (alert_pct is null or (alert_pct between 1 and 90)) not valid;
  end if;
end $$;
