-- Luxury Catalog: lived "how you carry it" wear notes (contribution slots
-- phase 2). Source: docs/ux/review-data-leaderboards.md "In-hand capture + the
-- give-us-your-stuff contribution surface" (2026-07-07). Two low-effort taps
-- the review/axis schema doesn't already capture:
--   * carry       — how the owner ACTUALLY carries it (hand / shoulder / crossbody)
--   * weight_feel — how heavy it FEELS in hand (light / just_right / heavy)
--
-- Both are FELT, lived signals, deduped against the measured catalog value
-- (strap options, gram weight). Per the locked rule "a thing we can measure from
-- data is never a subjective vote", these capture only the lived experience;
-- the measured facts stay in the catalog.
--
-- HUMAN-GATED MIGRATION — like 0012, this is NOT applied or runtime-tested by the
-- authoring session (no Supabase credentials in the cloud build). A human must
-- APPLY this and SMOKE-TEST the set / update / clear + aggregate path. The app
-- ships resilient: the carry/weight slots stay hidden until this table exists.

-- ============ Table: bag_wear (one row per user, per bag) ============
-- Both taps live in one row (one write path), mirroring how `review` is
-- one-per-user-per-bag. Each column is independently nullable: a user can set
-- carry without weight_feel, or the reverse. A re-tap is an upsert on
-- (user_id, variant_id). Closed CHECK sets keep the value space stable and
-- rankable, the same discipline as the `review.occasion` enum (0028).

create table bag_wear (
  bag_wear_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  carry text check (carry in ('hand', 'shoulder', 'crossbody')),
  weight_feel text check (weight_feel in ('light', 'just_right', 'heavy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index on bag_wear (variant_id);

create trigger bag_wear_set_updated_at
  before update on bag_wear
  for each row execute function set_updated_at();

alter table bag_wear enable row level security;

-- Public read so anyone can see the aggregate "how owners carry it" summary —
-- the same public-aggregate posture as `bag_axis_vote` and public `review`
-- reads. Individual rows carry no private text.
create policy "bag_wear_select_public" on bag_wear
  for select using (true);

-- Owner-only writes, matching the *_insert_own / *_update_own naming.
create policy "bag_wear_insert_own" on bag_wear
  for insert with check (auth.uid() = user_id);

create policy "bag_wear_update_own" on bag_wear
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bag_wear_delete_own" on bag_wear
  for delete using (auth.uid() = user_id);
