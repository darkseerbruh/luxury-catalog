-- Phase 2: Personalization — precomputed per-user recommendations table
--
-- Populated nightly by /api/cron/rebuild-recs (Vercel) and optionally via
-- pg_cron. Serves the personalized home rail and other Phase-2 surfaces.
-- The ranker (src/lib/personalization/ranker.ts) applies:
--   attribute/affinity scoring → Bayesian popularity prior → epsilon-greedy
--   exploration → MMR diversity re-rank.
--
-- RLS: authenticated users read their own rows. Service role writes all.

create table user_recs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null,
  rank       int not null check (rank >= 1),
  score      numeric not null,
  why        text,
  -- 'affinity' | 'popularity' | 'explore'
  algo       text not null default 'affinity',
  computed_at timestamptz not null default now(),
  primary key (user_id, variant_id)
);

create index user_recs_user_rank_idx on user_recs (user_id, rank);

alter table user_recs enable row level security;

create policy "users_read_own_recs" on user_recs
  for select
  using ((select auth.uid()) = user_id);

-- Service role bypasses RLS — no service_role policy needed.
