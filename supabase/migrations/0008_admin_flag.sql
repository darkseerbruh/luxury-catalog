-- Luxury Catalog: admin flag (security must-fix)
-- Apply after 0006_social_expert_layer.sql (extends `profile`).
--
-- Gates /admin/* behind an authenticated user whose profile.is_admin is true.
--
-- HUMAN-GATED: is_admin is ADMIN-GRANTED ONLY — never self-serve. There is
-- deliberately NO RLS policy that lets a user set this column on their own row;
-- the existing 0002 profile update policy must not expose is_admin to clients.
-- After applying this migration, the operator must set their OWN flag once via
-- the Supabase SQL editor (service role), or they will be locked out of admin:
--
--   update profile set is_admin = true where id = '<your-auth-user-uuid>';
--
-- The app guard FAILS CLOSED: if this column does not exist yet (pre-migration)
-- or cannot be read, admin access is DENIED.

alter table profile add column is_admin boolean not null default false;

-- Defense in depth: the 0002 `profile_update_own` RLS policy lets a user update
-- their own row, which by default includes every column. RLS gates ROWS, not
-- COLUMNS, so without this a user could self-grant is_admin (and the 0006 trust
-- flags). Revoke column-level UPDATE on the privileged columns from the client
-- roles so only the service role (admin grant) can change them. SELECT is left
-- intact. (Wrapped in a DO block so it is tolerant of the trust columns not yet
-- existing in some environments.)
do $$
begin
  revoke update (is_admin) on profile from anon, authenticated;
  if exists (
    select 1 from information_schema.columns
    where table_name = 'profile' and column_name = 'is_verified'
  ) then
    revoke update (is_verified, is_expert, is_authenticator) on profile from anon, authenticated;
  end if;
end $$;
