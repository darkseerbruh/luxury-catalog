-- 0057_rls_snapshot_production_option.sql
--
-- Close the Supabase security-advisor finding (rls_disabled_in_public, email
-- 2026-07-12): lc_index_snapshot (0049) and production_option (0054) were created
-- without `enable row level security`, and Supabase's default privileges grant the
-- anon role FULL write on new public tables. Net effect: anyone with the public
-- anon key (it ships in the site's JS) could insert/update/delete rows in both.
--
-- Fix mirrors every other public table in the schema:
--   * enable RLS
--   * public read stays (the app reads both with the anon key:
--     src/lib/lc-index.ts, src/lib/production-options.ts)
--   * no write policies — writes are service-role only (the lc-index-snapshot
--     cron and load-production-options.ts loader), and service role bypasses RLS
--   * belt-and-braces: revoke the default write grants from anon/authenticated
--
-- HUMAN-GATED MIGRATION — apply via GitHub → Actions → "Apply database
-- migrations" → Run workflow (blank input), after 0056.

alter table lc_index_snapshot enable row level security;
alter table production_option enable row level security;

drop policy if exists lc_index_snapshot_select_all on lc_index_snapshot;
create policy lc_index_snapshot_select_all on lc_index_snapshot
  for select using (true);

drop policy if exists production_option_select_all on production_option;
create policy production_option_select_all on production_option
  for select using (true);

revoke insert, update, delete, truncate, references, trigger
  on lc_index_snapshot from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on production_option from anon, authenticated;
