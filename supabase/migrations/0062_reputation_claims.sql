-- Luxury Catalog: Reputation claims — synthesised statements about a bag that the
-- community ratifies or rejects.
--
-- WHY (docs/ux/bag-page-build-plan.md §6, owner idea 2026-07-25, approved 07-26):
-- this is the cold-start fix and the highest-engagement mechanic we found, in one.
--
-- Two problems it solves at once:
--   1. A bag page is useless before anyone contributes. A claim synthesised from
--      published reviews makes the page genuinely informative on day one.
--   2. Writing a review is a high bar. Agreeing with a sentence is not. On
--      Fragrantica (observed live 2026-07-26) a single summarised line carried up
--      to 1,600 votes on a page holding 3,900 written reviews, and rating votes
--      outnumbered reviews roughly 7.5 to 1.
--
-- The pattern: WE draft from real published sources, the CROWD ratifies. A claim
-- the crowd rejects sinks on its own, so the surface degrades honestly.
--
-- HONESTY RULES, enforced by the schema where possible:
--   * `sources` is NOT NULL and must be a non-empty array. A claim with no source
--     cannot be inserted. This is the never-invent rule made structural.
--   * `source_mix` records how many of those sources were COMMERCIAL (they earn
--     from the bag) versus COMMUNITY (unpaid). The Chanel 19 proof of concept
--     found paid reviewers skew positive while forum and Reddit voices carry the
--     honest negatives, so the read layer weights criticism toward community.
--   * `as_of` dates every claim. Reputation drifts; an undated claim is a lie
--     waiting to happen.
--   * `stale_votes` lets owners mark a claim no longer true (a bag reissued since
--     the sources were written). Nobody in the category does this.
--
-- Claims are never republication: they are synthesised in our own words and link
-- out. See docs/research-drafts/reputation-poc-chanel-19.md.

begin;

create type claim_stance as enum ('pro', 'con', 'neutral');

create table reputation_claim (
  claim_id bigint generated always as identity primary key,
  variant_id bigint references variant(variant_id) on delete cascade,
  style_id bigint references style(style_id) on delete cascade,

  -- The claim, in OUR words. Short and specific, never a quote.
  body text not null check (char_length(body) between 10 and 240),
  stance claim_stance not null,

  -- Which owner axis this speaks to, when it maps to one. Lets a claim sit beside
  -- the matching scale instead of in a separate pile. Free text rather than the
  -- bag_axis enum so a claim can outlive an axis rename.
  axis_hint text,

  -- Provenance. Non-empty by constraint: no source, no claim.
  sources jsonb not null check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) > 0),
  community_sources smallint not null default 0 check (community_sources >= 0),
  commercial_sources smallint not null default 0 check (commercial_sources >= 0),

  -- When the sources were read. Reputation drifts, so every claim is dated.
  as_of date not null,

  -- Denormalised tallies, kept by the vote triggers below so reads never aggregate.
  agree_votes integer not null default 0 check (agree_votes >= 0),
  disagree_votes integer not null default 0 check (disagree_votes >= 0),
  stale_votes integer not null default 0 check (stale_votes >= 0),

  -- Set when we retire a claim (superseded, or voted down decisively).
  retired_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A claim belongs to exactly one of variant or style, never both, never neither.
  constraint reputation_claim_one_target check (
    (variant_id is not null and style_id is null) or
    (variant_id is null and style_id is not null)
  )
);

create index reputation_claim_variant_idx on reputation_claim (variant_id) where retired_at is null;
create index reputation_claim_style_idx on reputation_claim (style_id) where retired_at is null;

create trigger reputation_claim_set_updated_at
  before update on reputation_claim
  for each row execute function set_updated_at();

-- ============ Votes ============
-- One vote per member per claim. Re-voting is an upsert, matching how review and
-- bag_axis_vote behave.

create type claim_vote_kind as enum ('agree', 'disagree', 'stale');

create table reputation_claim_vote (
  claim_vote_id bigint generated always as identity primary key,
  claim_id bigint not null references reputation_claim(claim_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind claim_vote_kind not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, claim_id)
);

create index reputation_claim_vote_claim_idx on reputation_claim_vote (claim_id);

create trigger reputation_claim_vote_set_updated_at
  before update on reputation_claim_vote
  for each row execute function set_updated_at();

-- Keep the denormalised tallies exact. Recomputing from scratch for the touched
-- claim is simpler and safer than incrementing, and the row count per claim is
-- small enough that correctness beats cleverness here.
create or replace function refresh_claim_tallies() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target bigint := coalesce(new.claim_id, old.claim_id);
begin
  update reputation_claim c set
    agree_votes    = (select count(*) from reputation_claim_vote v where v.claim_id = target and v.kind = 'agree'),
    disagree_votes = (select count(*) from reputation_claim_vote v where v.claim_id = target and v.kind = 'disagree'),
    stale_votes    = (select count(*) from reputation_claim_vote v where v.claim_id = target and v.kind = 'stale')
  where c.claim_id = target;
  return null;
end $$;

create trigger reputation_claim_vote_tally
  after insert or update or delete on reputation_claim_vote
  for each row execute function refresh_claim_tallies();

-- ============ RLS (per supabase/migrations/README.md) ============

alter table reputation_claim enable row level security;
alter table reputation_claim_vote enable row level security;

-- Claims are public reading; only the service role writes them (the synthesis
-- pipeline). No anon or authenticated write path at all.
create policy "reputation_claim_select_all" on reputation_claim
  for select using (true);

-- Votes are publicly readable in aggregate (the tallies live on the claim anyway),
-- and each member writes only their own.
create policy "reputation_claim_vote_select_all" on reputation_claim_vote
  for select using (true);
create policy "reputation_claim_vote_insert_own" on reputation_claim_vote
  for insert with check (auth.uid() = user_id);
create policy "reputation_claim_vote_update_own" on reputation_claim_vote
  for update using (auth.uid() = user_id);
create policy "reputation_claim_vote_delete_own" on reputation_claim_vote
  for delete using (auth.uid() = user_id);

revoke insert, update, delete on reputation_claim from anon, authenticated;
revoke all on reputation_claim_vote from anon;

commit;
