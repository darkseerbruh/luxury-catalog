-- Luxury Catalog: "My Four Grails" — identity badge (UX backlog #14, brief §C).
-- Source: docs/ux/ux-evaluation.md #14 (Four Grails) + ux-research-brief.md §C
-- (Letterboxd "Four Favorites"). A fixed-scarcity, poster-driven taste badge:
-- exactly up to four favourite variants pinned to a profile.
--
-- HUMAN-GATED MIGRATION — like 0007–0010, this is NOT applied or runtime-tested
-- by the authoring session (no Supabase credentials in the cloud build). A human
-- must APPLY this after 0010_notification_prefs.sql and SMOKE-TEST the
-- set / reorder / clear path before relying on it.

-- ============ Table: four_grails (up to 4 pinned favourites per user) ============
-- position 1..4 ranks the four slots; unique (user_id, position) keeps one bag
-- per slot, and unique (user_id, variant_id) stops the same bag occupying two
-- slots. The position CHECK caps the set at four without a trigger.

create table four_grails (
  four_grail_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  created_at timestamptz not null default now(),
  unique (user_id, position),
  unique (user_id, variant_id)
);

create index on four_grails (user_id);

alter table four_grails enable row level security;

-- Public read mirrors 0006's `closet_item_select_public`: grails of users whose
-- profile/closet is public (or who are notable: expert/authenticator/verified)
-- are world-readable, exactly the surface that exposes a public profile. The
-- owner always sees their own via the *_select_own policy below (policies OR).
create policy "four_grails_select_public" on four_grails
  for select using (
    exists (
      select 1 from profile p
      where p.id = four_grails.user_id
        and (p.closet_public or p.is_expert or p.is_authenticator or p.is_verified)
    )
  );

create policy "four_grails_select_own" on four_grails
  for select using (auth.uid() = user_id);

-- Owner-only writes, matching the 0002/0006 *_insert_own / *_update_own naming.
create policy "four_grails_insert_own" on four_grails
  for insert with check (auth.uid() = user_id);

create policy "four_grails_update_own" on four_grails
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "four_grails_delete_own" on four_grails
  for delete using (auth.uid() = user_id);
