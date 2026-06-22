-- Luxury Catalog: user photo contributions + contributor points
-- Apply after 0008_admin_flag.sql (admin review policies) and 0013_variant_image
-- (variant.image_url, the single hero the featured photo can promote into).
--
-- The UGC engine the contributor-tier ladder rewards: users submit real, owned,
-- rights-attested reference photos of a bag. HYBRID MODERATION — trusted users
-- (Authenticator tier / admins) auto-publish; everyone else is queued for review
-- in /admin/photos. Tier is DERIVED (src/lib/contributions-core.ts) from
-- profile.contribution_points + the 0006 is_authenticator flag, so this migration
-- adds only the points column, not a tier column.
--
-- The app degrades gracefully if this is absent (galleries empty, submit fails
-- with a clear message). Storage upload is the one piece that cannot be tested
-- from a cloud session (no creds); the bucket + policies below are human-gated.

create type photo_status as enum ('pending', 'approved', 'featured', 'rejected');

create table bag_photo (
  photo_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Path within the `bag-photos` Storage bucket (public read). The row is the
  -- source of truth for moderation status; the object is just the bytes.
  storage_path text not null,
  caption text,
  status photo_status not null default 'pending',
  -- Ownership + display-rights attestation, captured at upload (UGC license).
  owner_attested boolean not null default false,
  -- Quality-weighted XP awarded when approved (rarer bag = more); recorded so a
  -- later removal can claw the same amount back. Service-role-written only.
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz
);

create index on bag_photo (variant_id, status);
create index on bag_photo (status, created_at desc);
create index on bag_photo (user_id);
-- At most one featured (hero) photo per variant.
create unique index bag_photo_one_featured_per_variant
  on bag_photo (variant_id) where status = 'featured';

alter table bag_photo enable row level security;

-- Anyone (incl. anon) may read published photos.
create policy "bag_photo_select_published" on bag_photo
  for select using (status in ('approved', 'featured'));
-- A user may read their OWN submissions in any status (to see pending/rejected).
create policy "bag_photo_select_own" on bag_photo
  for select using (auth.uid() = user_id);
-- Admins may read everything (the moderation queue).
create policy "bag_photo_select_admin" on bag_photo
  for select using (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_admin)
  );

-- Authenticated users may submit their OWN photo, only as 'pending', and only
-- with the ownership/license attestation checked. Auto-publish for trusted tiers
-- is done server-side with the service-role client (it is NOT self-serve here).
create policy "bag_photo_insert_own" on bag_photo
  for insert with check (
    auth.uid() = user_id and status = 'pending' and owner_attested = true
  );

-- A user may delete their OWN photo (takedown of their submission).
create policy "bag_photo_delete_own" on bag_photo
  for delete using (auth.uid() = user_id);
-- Admins may change status (approve / feature / reject) + stamp the reviewer.
create policy "bag_photo_update_admin" on bag_photo
  for update using (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_admin)
  ) with check (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_admin)
  );

-- Contributor XP. DERIVED tier reads this + is_authenticator. Revoke client-side
-- UPDATE so points can't be self-granted (anti-gaming); service role writes them
-- on approval/removal, same defense-in-depth as 0008's privileged columns.
alter table profile add column contribution_points int not null default 0;
revoke update (contribution_points) on profile from anon, authenticated;

-- Storage bucket for the uploaded bytes (public read; the row gates visibility in
-- the app, but a public bucket keeps the object URLs simple + CDN-cacheable).
insert into storage.buckets (id, name, public)
  values ('bag-photos', 'bag-photos', true)
  on conflict (id) do nothing;

-- Storage RLS: anyone reads; an authenticated user writes/deletes only objects
-- they own. Path convention written by the app: `<variant_id>/<user_id>/<file>`.
create policy "bag_photos_public_read" on storage.objects
  for select using (bucket_id = 'bag-photos');
create policy "bag_photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'bag-photos' and owner = auth.uid());
create policy "bag_photos_delete_own" on storage.objects
  for delete using (bucket_id = 'bag-photos' and owner = auth.uid());
