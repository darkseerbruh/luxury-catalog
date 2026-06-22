-- Luxury Catalog: multi-axis subjective voting (UX backlog #18, brief §F).
-- Source: docs/ux/ux-evaluation.md #18 + ux-research-brief.md §F (Fragrantica
-- multi-axis voting + "character bars"). Owners rate a bag on a fixed set of
-- subjective axes; the bag page renders per-axis proportional bars from the
-- aggregate average + vote count.
--
-- HUMAN-GATED MIGRATION — like 0007–0011, this is NOT applied or runtime-tested
-- by the authoring session (no Supabase credentials in the cloud build). A human
-- must APPLY this after 0011_four_grails.sql and SMOKE-TEST the cast / update /
-- clear vote + aggregate path before relying on it.

-- ============ Fixed axis vocabulary ============
-- A closed enum keeps the vote space stable (Fragrantica-style fixed axes) and
-- lets the UI render a known set of bars. Adding an axis later is an additive
-- `alter type ... add value` in a follow-up migration.

create type bag_axis as enum (
  'build_quality',
  'everyday_wearability',
  'holds_value',
  'roomy_vs_compact',
  'comfort',
  'versatility',
  'worth_the_price'
);

-- ============ Table: bag_axis_vote (one vote per user, per bag, per axis) ============
-- value is a 1..5 smallint (rendered as a 0..100% bar). The unique constraint
-- makes a re-vote an upsert (onConflict user_id,variant_id,axis), mirroring how
-- `review` is one-per-user-per-bag.

create table bag_axis_vote (
  bag_axis_vote_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  axis bag_axis not null,
  value smallint not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id, axis)
);

create index on bag_axis_vote (variant_id);

create trigger bag_axis_vote_set_updated_at
  before update on bag_axis_vote
  for each row execute function set_updated_at();

alter table bag_axis_vote enable row level security;

-- Public read so anyone can see the aggregate "how owners rate it" bars — the
-- same public-aggregate posture as 0006's `closet_favorite_select_all` and the
-- public `review` reads. Individual votes carry no private text.
create policy "bag_axis_vote_select_public" on bag_axis_vote
  for select using (true);

-- Owner-only writes, matching the 0002/0006 *_insert_own / *_update_own naming.
create policy "bag_axis_vote_insert_own" on bag_axis_vote
  for insert with check (auth.uid() = user_id);

create policy "bag_axis_vote_update_own" on bag_axis_vote
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bag_axis_vote_delete_own" on bag_axis_vote
  for delete using (auth.uid() = user_id);
