-- Luxury Catalog — lc_index_snapshot: monthly rank history for the LC Index.
--
-- Why: the standing module and the Index page show a "movement" pill (▲ 2 this
-- month) so the ranking reads as a living chart worth revisiting. That needs last
-- month's rank to compare against. The /api/cron/lc-index-snapshot job writes one
-- row per style per month; the app compares the live rank to the most recent
-- PRIOR-month snapshot. See docs/ux/lc-index-spec.md.
--
-- Public SELECT (the app reads prior ranks with the anon key); writes are
-- service-role only (the cron), so no INSERT/UPDATE grant to anon.

create table if not exists lc_index_snapshot (
  captured_month date    not null,   -- first day of the capture month
  style_id       bigint  not null references style(style_id) on delete cascade,
  rank           integer not null,
  primary key (captured_month, style_id)
);

-- Fast "latest prior month" + per-month lookups.
create index if not exists lc_index_snapshot_month_idx
  on lc_index_snapshot (captured_month desc);

grant select on lc_index_snapshot to anon, authenticated;
