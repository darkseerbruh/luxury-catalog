-- SECURITY: enable Row-Level Security on every public table that was missing it.
--
-- Supabase's security advisor flagged `rls_disabled_in_public` (critical): a table
-- in the `public` schema with RLS off is fully exposed through PostgREST to the
-- anon API key — anyone with the project URL can READ, INSERT, UPDATE, and DELETE
-- every row. This migration closes that hole by enabling RLS and adding policies
-- that reproduce the INTENDED access for each table (and nothing more). The
-- service-role key bypasses RLS, so seeds / ingest / admin reads are unaffected.
--
-- Grouped by intent:
--   A) Catalog / reference data — meant to be world-READABLE (the catalog is free,
--      prices are shown Google-style), but only writable by the service role
--      (owner-curated seeds + ingest). RLS on + public SELECT, no write policy.
--   B) Append-only user/anon logs (search misses, feedback) — anon may INSERT, but
--      reads move to the service-role admin client (see the paired code change in
--      src/lib/queries.ts). RLS on + public INSERT, no SELECT/UPDATE/DELETE.
--   C) Service-role-only staging (discovered_listing) — no anon access at all.
--      RLS on, no policies (service role bypasses RLS).
--
-- HUMAN-GATED + re-runnable: drop-then-create each policy so a repair re-run is
-- safe. Enabling RLS is idempotent. Apply AFTER deploying the queries.ts change
-- (service-role reads), so the admin dashboards keep working through the switch.

-- ============ A) Catalog / reference: public SELECT, service-role writes ============
do $$
declare t text;
begin
  foreach t in array array[
    'brand', 'style', 'variant', 'material', 'carry_method', 'fits',
    'interior_storage', 'known_color_combination', 'lock_and_key',
    'provenance_packaging', 'production_record', 'serial_tag', 'price_history'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_public', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_select_public', t);
  end loop;
end $$;

-- ============ B) Append-only logs: anon INSERT only (reads via service role) ============
alter table public.searched_not_found enable row level security;
drop policy if exists searched_not_found_insert_public on public.searched_not_found;
create policy searched_not_found_insert_public on public.searched_not_found
  for insert with check (true);

alter table public.user_feedback enable row level security;
drop policy if exists user_feedback_insert_public on public.user_feedback;
create policy user_feedback_insert_public on public.user_feedback
  for insert with check (true);

-- ============ C) Service-role-only staging: RLS on, no policies ============
alter table public.discovered_listing enable row level security;
