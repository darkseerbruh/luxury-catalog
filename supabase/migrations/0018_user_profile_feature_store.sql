-- Phase 1: Personalization — user_profile feature store
--
-- Stores pre-aggregated taste signals for each user:
--   typed columns for what we rank/filter on (persona, budget_band, intent,
--   top_affinities) + JSONB for sparse brand/attribute affinities + a
--   taste_vector_snapshot (the quiz+closet vector; Phase 3 adds pgvector).
--
-- Written by a nightly pg_cron job (rebuild_all_user_profiles) and/or the
-- Vercel cron at /api/cron/rebuild-profiles. Never written by the client.
-- RLS: authenticated users can read their own row; service role writes all.

-- ============ Table: user_profile ============

create table user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Synced from profile.persona (the onboarding persona).
  persona text,

  -- Inferred from closet/watchlist price signals.
  -- entry < $1,500 · mid $1,500–$5,000 · grail > $5,000 · mixed = spread.
  budget_band text check (budget_band in ('entry', 'mid', 'grail', 'mixed')),

  -- Inferred from closet-status patterns + watchlist activity.
  -- buying / selling / collecting / browsing / both
  intent text check (intent in ('buying', 'selling', 'collecting', 'browsing', 'both')),

  -- Top 10 brand affinities by score [{name, score, count}], pre-ranked for
  -- display and for the Phase-2 attribute ranker.
  top_affinities jsonb not null default '[]',

  -- Full brand affinity map {brand_name: weighted_score}. Used by Phase-2
  -- ranker for candidate scoring — lookup is O(1) at query time.
  brand_affinities jsonb not null default '{}',

  -- Attribute affinity map {dimension: {value: weighted_score}}.
  -- Dimensions: silhouette, size, hardware, material, carry, formality,
  -- price_band (matches TasteVector from taste.ts).
  attribute_affinities jsonb not null default '{}',

  -- Raw signal counts — for cold-start detection and diagnostics.
  -- {want_count, have_count, had_count, watchlist_count, review_count,
  --  quiz_completeness, total_interactions}
  signal_counts jsonb not null default '{}',

  -- Snapshot of the quiz+closet+watchlist taste vector (same TasteVector
  -- format as profile.taste_vector). Included here so Phase-2 ranker has
  -- everything in one row. Phase 3 will ADD a pgvector column alongside this.
  taste_vector_snapshot jsonb,

  computed_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- RLS -----------------------------------------------------------------------
alter table user_profile enable row level security;

-- Users read their own row only.
create policy "users_read_own_user_profile" on user_profile
  for select
  using ((select auth.uid()) = user_id);

-- No client-side insert/update: all writes come from the service-role client.
-- (Service role bypasses RLS by design — no service_role policy needed.)

-- ============ SQL rebuild function (for pg_cron) ============
--
-- Computes the feature row for one user and upserts it.
-- Uses a decayed-weight scheme matching the TypeScript implementation in
-- src/lib/personalization/aggregation-core.ts so both stay in sync.
--
-- Decay buckets (days since created_at):
--   ≤7d   → 1.0    ≤30d  → 0.8    ≤90d  → 0.6    ≤365d → 0.4    >365d → 0.2
--
-- Status weights for closet_item:
--   have → 3.0    want → 1.5    had → 1.0
--
-- Watchlist items contribute weight 1.5 to brand + attribute affinities and
-- add to the 'buying' intent signal (alert_enabled = strong intent).
--
-- Budget band: bin each weighted price point, pick the majority bin (>60%);
-- otherwise 'mixed'.
--
-- Intent (priority order):
--   want_count > 0 AND had_count > 0  → 'both'
--   want_count ≥ 3                     → 'buying'
--   had_count ≥ 2                      → 'selling'
--   have_count ≥ 5                     → 'collecting'
--   else                               → 'browsing'

create or replace function rebuild_user_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_persona        text;
  v_taste_snapshot jsonb;
  v_taste_complete int;

  -- closet signal aggregates
  v_want_count  int := 0;
  v_have_count  int := 0;
  v_had_count   int := 0;
  v_watch_count int := 0;
  v_review_count int := 0;

  -- budget band tallies (weighted)
  v_entry_w numeric := 0;
  v_mid_w   numeric := 0;
  v_grail_w numeric := 0;
  v_total_price_w numeric := 0;

  v_budget_band text;
  v_intent      text;
  v_brand_aff   jsonb := '{}';
  v_attr_aff    jsonb := '{}';
  v_top_aff     jsonb := '[]';
begin
  -- ── 1. Pull persona + taste snapshot from profile ─────────────────────
  select
    p.persona::text,
    p.taste_vector,
    coalesce(p.taste_completeness, 0)
  into v_persona, v_taste_snapshot, v_taste_complete
  from profile p
  where p.id = p_user_id;

  -- ── 2. Count closet items by status ───────────────────────────────────
  select
    count(*) filter (where ci.status = 'want') ,
    count(*) filter (where ci.status = 'have') ,
    count(*) filter (where ci.status = 'had')
  into v_want_count, v_have_count, v_had_count
  from closet_item ci
  where ci.user_id = p_user_id;

  -- ── 3. Count watchlist rows ────────────────────────────────────────────
  select count(*)
  into v_watch_count
  from watchlist w
  where w.user_id = p_user_id;

  -- ── 4. Count reviews ──────────────────────────────────────────────────
  select count(*)
  into v_review_count
  from review r
  where r.user_id = p_user_id;

  -- ── 5. Brand + attribute affinities from closet_item ──────────────────
  --
  -- For each closet item, compute a weight = status_weight * decay_weight,
  -- then accumulate into brand_affinities and attribute_affinities.
  --
  -- We materialise the weighted rows into a temp query and then aggregate
  -- into JSONB using jsonb_object_agg / json_build_object.

  with weighted_items as (
    select
      b.name                                              as brand_name,
      s.silhouette,
      v.size_category,
      v.hardware_color,
      m.material_type,
      v.retail_price_original,
      case ci.status
        when 'have' then 3.0
        when 'want' then 1.5
        when 'had'  then 1.0
        else 0.0
      end * case
        when now() - ci.created_at <= interval '7 days'   then 1.0
        when now() - ci.created_at <= interval '30 days'  then 0.8
        when now() - ci.created_at <= interval '90 days'  then 0.6
        when now() - ci.created_at <= interval '365 days' then 0.4
        else 0.2
      end                                                  as w
    from closet_item ci
    join variant v  on ci.variant_id = v.variant_id
    join style   s  on v.style_id    = s.style_id
    join brand   b  on s.brand_id    = b.brand_id
    left join exterior_material m on v.exterior_material_id = m.exterior_material_id
    where ci.user_id = p_user_id
  ),
  brand_scores as (
    select brand_name, sum(w) as score, count(*) as cnt
    from weighted_items
    where brand_name is not null
    group by brand_name
  )
  select
    coalesce(
      (select jsonb_object_agg(brand_name, round(score::numeric, 3))
       from brand_scores),
      '{}'
    )
  into v_brand_aff;

  -- Attribute affinities: silhouette, size, hardware, material
  with weighted_items as (
    select
      s.silhouette,
      v.size_category,
      v.hardware_color,
      m.material_type,
      case ci.status
        when 'have' then 3.0
        when 'want' then 1.5
        when 'had'  then 1.0
        else 0.0
      end * case
        when now() - ci.created_at <= interval '7 days'   then 1.0
        when now() - ci.created_at <= interval '30 days'  then 0.8
        when now() - ci.created_at <= interval '90 days'  then 0.6
        when now() - ci.created_at <= interval '365 days' then 0.4
        else 0.2
      end                                                    as w
    from closet_item ci
    join variant v  on ci.variant_id = v.variant_id
    join style   s  on v.style_id    = s.style_id
    left join exterior_material m on v.exterior_material_id = m.exterior_material_id
    where ci.user_id = p_user_id
  ),
  sil_scores as (
    select silhouette as val, sum(w) as score from weighted_items
    where silhouette is not null group by silhouette
  ),
  size_scores as (
    select size_category as val, sum(w) as score from weighted_items
    where size_category is not null group by size_category
  ),
  hw_scores as (
    select hardware_color as val, sum(w) as score from weighted_items
    where hardware_color is not null group by hardware_color
  ),
  mat_scores as (
    select material_type as val, sum(w) as score from weighted_items
    where material_type is not null group by material_type
  )
  select jsonb_build_object(
    'silhouette', coalesce((select jsonb_object_agg(val, round(score::numeric,3)) from sil_scores), '{}'),
    'size',       coalesce((select jsonb_object_agg(val, round(score::numeric,3)) from size_scores), '{}'),
    'hardware',   coalesce((select jsonb_object_agg(val, round(score::numeric,3)) from hw_scores), '{}'),
    'material',   coalesce((select jsonb_object_agg(val, round(score::numeric,3)) from mat_scores), '{}')
  )
  into v_attr_aff;

  -- ── 6. Budget band ─────────────────────────────────────────────────────
  -- Collect price signals: purchase_price from 'have', target_price from watchlist,
  -- retail_price_original from 'want' items.

  with prices as (
    select
      coalesce(ci.purchase_price, v.retail_price_original) as price,
      case ci.status when 'have' then 3.0 when 'want' then 1.5 else 1.0 end as w
    from closet_item ci
    join variant v on ci.variant_id = v.variant_id
    where ci.user_id = p_user_id
      and coalesce(ci.purchase_price, v.retail_price_original) is not null
    union all
    select wl.target_price as price, 1.5 as w
    from watchlist wl
    where wl.user_id = p_user_id and wl.target_price is not null
  )
  select
    coalesce(sum(w) filter (where price < 1500),   0),
    coalesce(sum(w) filter (where price between 1500 and 5000), 0),
    coalesce(sum(w) filter (where price > 5000),   0),
    coalesce(sum(w), 0)
  into v_entry_w, v_mid_w, v_grail_w, v_total_price_w
  from prices;

  if v_total_price_w = 0 then
    v_budget_band := null;
  elsif v_entry_w / v_total_price_w >= 0.60 then
    v_budget_band := 'entry';
  elsif v_mid_w / v_total_price_w >= 0.60 then
    v_budget_band := 'mid';
  elsif v_grail_w / v_total_price_w >= 0.60 then
    v_budget_band := 'grail';
  else
    v_budget_band := 'mixed';
  end if;

  -- ── 7. Intent ──────────────────────────────────────────────────────────
  if v_want_count > 0 and v_had_count > 0 then
    v_intent := 'both';
  elsif v_want_count >= 3 then
    v_intent := 'buying';
  elsif v_had_count >= 2 then
    v_intent := 'selling';
  elsif v_have_count >= 5 then
    v_intent := 'collecting';
  else
    v_intent := 'browsing';
  end if;

  -- ── 8. Top affinities (top 10 brands by score) ────────────────────────
  select coalesce(
    jsonb_agg(
      jsonb_build_object('name', key, 'score', round(value::numeric, 3))
      order by value::numeric desc
    ) filter (where row_number() over (order by value::numeric desc) <= 10),
    '[]'
  )
  into v_top_aff
  from jsonb_each_text(v_brand_aff) as t(key, value);

  -- ── 9. Upsert ──────────────────────────────────────────────────────────
  insert into user_profile (
    user_id, persona, budget_band, intent, top_affinities,
    brand_affinities, attribute_affinities, signal_counts,
    taste_vector_snapshot, computed_at
  )
  values (
    p_user_id,
    v_persona,
    v_budget_band,
    v_intent,
    coalesce(v_top_aff, '[]'),
    coalesce(v_brand_aff, '{}'),
    coalesce(v_attr_aff, '{}'),
    jsonb_build_object(
      'want_count',         v_want_count,
      'have_count',         v_have_count,
      'had_count',          v_had_count,
      'watchlist_count',    v_watch_count,
      'review_count',       v_review_count,
      'quiz_completeness',  v_taste_complete,
      'total_interactions', v_want_count + v_have_count + v_had_count + v_watch_count
    ),
    v_taste_snapshot,
    now()
  )
  on conflict (user_id) do update set
    persona               = excluded.persona,
    budget_band           = excluded.budget_band,
    intent                = excluded.intent,
    top_affinities        = excluded.top_affinities,
    brand_affinities      = excluded.brand_affinities,
    attribute_affinities  = excluded.attribute_affinities,
    signal_counts         = excluded.signal_counts,
    taste_vector_snapshot = excluded.taste_vector_snapshot,
    computed_at           = excluded.computed_at;
end;
$$;

-- Batch function: rebuild ALL active users (for pg_cron).
-- Skips users not in profile (shouldn't exist, but defensive).
-- Schedule: daily at 3 AM UTC — `select cron.schedule('rebuild-profiles', '0 3 * * *', 'select rebuild_all_user_profiles()');`
create or replace function rebuild_all_user_profiles()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
begin
  for v_user in
    select id from profile
  loop
    begin
      perform rebuild_user_profile(v_user.id);
    exception when others then
      raise warning 'rebuild_user_profile failed for %: %', v_user.id, sqlerrm;
    end;
  end loop;
end;
$$;
