-- Luxury Catalog: structured catalog corrections ("suggest an edit")
-- Apply after 0008_admin_flag.sql (depends on profile.is_admin for the admin
-- review policies, and on variant/style/brand from 0001).
--
-- Lets authenticated users propose a structured edit to a catalogued field
-- (a value for one field on a variant, or on a style/brand). Submissions are
-- triaged in /admin/corrections. ACCEPTING a correction only marks its status
-- accepted + records the reviewer — it does NOT auto-write the catalog; applying
-- the change is a deliberate, manual admin data task (protects data integrity /
-- the "never invent" rule).

create type correction_status as enum ('pending', 'accepted', 'rejected');

create table correction (
  correction_id bigint generated always as identity primary key,
  -- Exactly one target is the common case (a variant); style/brand allow
  -- corrections to non-variant catalog entities. All nullable; the action layer
  -- guarantees at least one is set.
  variant_id bigint references variant(variant_id) on delete cascade,
  style_id bigint references style(style_id) on delete cascade,
  brand_id bigint references brand(brand_id) on delete cascade,
  field_path text not null,
  current_value text,
  suggested_value text not null,
  note text,
  status correction_status not null default 'pending',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz
);

create index on correction (status, created_at desc);
create index on correction (variant_id);
create index on correction (created_by);

alter table correction enable row level security;

-- Authenticated users may submit their OWN corrections.
create policy "correction_insert_own" on correction
  for insert with check (auth.uid() = created_by);

-- A user may read their OWN corrections (to see status). Admins may read ALL.
create policy "correction_select_own" on correction
  for select using (auth.uid() = created_by);
create policy "correction_select_admin" on correction
  for select using (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_admin)
  );

-- Only admins may change status (accept/reject) + stamp the reviewer.
create policy "correction_update_admin" on correction
  for update using (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_admin)
  ) with check (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_admin)
  );

-- NOTE: public/anon cannot read corrections at all (no permissive select for
-- anon), so one user's proposed edits are never exposed to others.
