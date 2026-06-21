# Remaining UX Backlog — Implementation Plan (migration / data-gated)

> **Why this is a plan, not a shipped feature.** This environment has no Supabase
> credentials, so DB features can't be runtime-tested, and the project treats
> migrations as **human-gated** (apply + smoke-test later — see `docs/handoff.md`,
> migrations 0007–0010). The items below are either **large net-new subsystems**
> (XP economy, Listopia) or **genuinely data-pipeline-dependent** (durability,
> resale index) where there is no source data in the DB yet. Rather than ship
> untested SQL/RLS/UI as if "done," this is a precise, ready-to-execute spec —
> migration drafts + file-level changes + live-DB verification — to implement
> together against a real Supabase.
>
> **Already shipped (build-verified, on this branch):** report Tier 1 #1–5,
> Tier 2 #6–11, Tier 3 #12–16 (the no-migration halves), plus Four Grails (#14)
> and multi-axis voting (#18) as human-gated migrations 0011/0012. This doc covers
> what's left: **#16 XP economy, #17 Listopia, #20 durability, #21 resale index.**
> Next migration number after 0012 is **0013**.

---

## #16 — Contribution XP economy + Top Contributors board

**Why.** NN/g gamification: reward *value-producing* behavior, not vanity; relative
& resettable leaderboards; 90-9-1 participation. Ties to the contributor ladder
already spec'd in `docs/handoff.md` (Aficionado → Collector → Connoisseur →
Authenticator → Curator). The current Top Reviewers board (shipped) ranks raw
review count only — XP generalizes it.

**Migration `0013_contribution_xp.sql`** (human-gated; apply after 0012)
```sql
-- Append-only ledger of point-earning contributions. Points are awarded by
-- server actions on APPROVED/value-producing events only (never on logins/clicks).
create type contribution_type as enum (
  'review_published', 'correction_accepted', 'photo_approved',
  'vote_cast', 'closet_add', 'grail_set');
create table contribution_event (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         contribution_type not null,
  points       smallint not null check (points between 0 and 100),
  ref_id       bigint,                        -- the review/correction/photo id
  created_at   timestamptz not null default now()
);
create index contribution_event_user_idx on contribution_event(user_id, created_at desc);
-- Public read (for leaderboards/aggregates); inserts only via service role
-- (server actions), so users can't self-award. Mirrors the admin-gated pattern.
alter table contribution_event enable row level security;
create policy contribution_event_select_public on contribution_event for select using (true);
-- no insert/update/delete policy => only service_role can write (matches 0008 posture)
```

**Code**
- `src/lib/xp.ts` — `POINTS` map (e.g. review 10, accepted correction 15, approved
  photo by rarity, vote 1, closet add 1); `getXp(userId, since? )` (sum, supports a
  season window); `getTopContributors(limit, season?)` in the `getCovetedClosets`
  style in `src/lib/social.ts`.
- `src/lib/xp-actions.ts` — `awardXp(userId, type, refId)` using the **service-role**
  client (the read-only client already used by `getPopularBags`); call it from the
  existing approval paths: `review-actions.ts` (on publish), `correction-actions.ts`
  (on admin accept), the photo-approval admin path, `vote-actions.ts`, and
  `collection-actions.ts`.
- **UI**: XP + ladder tier on `/profile` and `/u/[handle]`; add a **Top Contributors**
  board (with a "This month" season toggle for resettability — NN/g relative
  leaderboards) to `/closets` alongside Coveted Closets + Top Reviewers.

**Verify (live DB):** apply 0013; publish a review / accept a correction → confirm
`contribution_event` rows + points; check `/closets` Top Contributors ordering and
the season toggle; confirm users cannot insert events directly (RLS).

---

## #17 — Listopia (user-created, upvotable lists)

**Why.** Goodreads Listopia + Letterboxd lists: crowd-sourced curation scales
discovery with zero editorial staff and produces evergreen, SEO-friendly browse
surfaces ("Best Bags Under $2k"). Honors the engagement-strategy "structured, not
free-form" rule — a list is bags + a title, not a forum.

**Migration `0014_lists.sql`** (human-gated; apply after 0013)
```sql
create table list (
  id            bigserial primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  slug          text not null unique,
  description   text check (char_length(description) <= 2000),
  is_public     boolean not null default true,
  is_ranked     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create table list_item (
  list_id    bigint not null references list(id) on delete cascade,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  position   int not null default 0,
  note       text check (char_length(note) <= 500),
  primary key (list_id, variant_id)
);
create table list_fan (               -- "fan" upvote, like Letterboxd
  list_id          bigint not null references list(id) on delete cascade,
  fan_user_id      uuid not null references auth.users(id) on delete cascade,
  primary key (list_id, fan_user_id)
);
-- RLS: public read of PUBLIC lists (+ owner reads own private); owner-only CRUD;
-- any signed-in user may fan. Mirrors closet_favorite (0006) for the fan table.
alter table list enable row level security;
create policy list_select on list for select using (is_public or owner_user_id = auth.uid());
create policy list_cud_own on list for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
-- (list_item + list_fan policies follow the same own/public pattern.)
```

**Code**
- `src/lib/lists.ts` (`getList(slug)`, `getUserLists(userId)`, `getPublicLists`,
  `getListsContaining(variantId)`) + `src/lib/list-actions.ts` (create/rename/
  reorder/add-item/remove-item/fan, mirroring `collection-actions.ts` + slug
  generation like `post`).
- **UI**: `/lists` (browse public + most-fanned, Listopia style), `/lists/[slug]`
  (view, ranked or not), `/lists/new` + edit; an **"Add to list"** control on the
  bag page (`BagActions` area); feature a user's lists on `/u/[handle]` and
  `/profile`. JSON-LD `ItemList` for GEO (reuse `src/lib/geo.ts` patterns).
- XP hook: optional `awardXp(..., 'list_published')` when made public.

**Verify (live DB):** apply 0014; create a list, add bags, publish, view at
`/lists/[slug]` while logged out, fan it from another account, confirm private
lists are hidden by RLS.

---

## #20 — Durability / "Ages-Well" signal  *(data-pipeline dependent)*

**Why & the honest framing (from the report).** Estimate how bags degrade from
observed resale **condition × age**. The `material` table's hardiness fields are
currently *asserted*; this makes them *evidenced*. **Survivorship/selection bias is
real** → present as an *observed condition distribution by age cohort with sample
size + confidence*, **not a guarantee**; compute **primarily at the material level**
(larger N, generalizes), per-variant only where the sample supports it.

**Blocker:** there is **no resale condition+age data in the DB**. This needs an
ingestion pipeline first (the existing `data/raw/*.csv` resale exports +
`price_history.condition` are the seed, but not at the needed scale/structure).

**Step 1 — pipeline + `0015_resale_observation.sql`** (human-gated)
```sql
create type condition_grade as enum         -- standardized ladder (Fashionphile/TRR/Vestiaire)
  ('pristine','excellent','very_good','good','fair');
create table resale_observation (
  id              bigserial primary key,
  variant_id      bigint references variant(variant_id) on delete set null,
  material_id     bigint references material(material_id) on delete set null,
  condition_grade condition_grade not null,
  age_years       numeric(4,1),              -- listing date − production year
  source          text,
  observed_at     date not null,
  created_at      timestamptz not null default now()
);
create index resale_observation_material_idx on resale_observation(material_id, age_years);
alter table resale_observation enable row level security;
create policy resale_observation_select_public on resale_observation for select using (true);
-- writes via service role only (ingestion job), no public insert policy.
```
- Extend the ingestion in `scripts/` (alongside `analytics-digest.ts`) to parse
  resale exports → map free-text condition to `condition_grade` → derive
  `age_years` from production year → upsert `resale_observation`.

**Step 2 — compute & UI**
- `src/lib/durability.ts`: `getMaterialDurability(materialId)` → for each age bucket
  (0-2, 3-5, 6-10, 10+ yrs) the condition distribution + `sampleSize`; a derived
  **"ages-well" score** only when `sampleSize ≥ threshold`, with a `confidence`
  label. Per-variant variant of the same when its own N supports it.
- **UI**: a "Durability / Ages-well" module in the material section of the bag page
  and on material-level pages — a condition-by-age curve or a Fragrantica-style
  derived bar, always labeled **"based on N observations"** + confidence + the
  survivorship caveat. Honor never-invent: render nothing when N is too low.

**Verify (live DB):** ingest a sample; confirm material-level distributions +
sample-size gating + confidence copy; spot-check a material with known behavior
(e.g. lambskin vs. caviar vs. coated canvas).

---

## #21 — Resale-Retention index + "Bags Above Retail" leaderboard  *(data-dependent)*

**Why.** WatchCharts Value-Retention: a single sortable "trades at X% vs. retail"
metric + a leaderboard reframes bags as an asset class (true for Birkins) — and is
editorial/GEO gold ("Most coveted / best-performing bags of 2026").

**Blocker:** needs aggregated **sold-price-over-time** data. `price_history` exists
but is sparse; this depends on the same scaled resale ingestion as #20.

**Compute (mostly on existing tables once data is dense enough)**
- `src/lib/market.ts`: `getValueRetention(variantId)` = median recent sale
  (`price_history`) ÷ `retailPriceOriginal`; `getRetentionLeaderboard()` ranked
  desc; optional points-based **basket index** (WatchCharts/ChronoPulse pattern:
  fixed epoch value, periodic rebalance) persisted via an optional
  `0016_market_index_snapshot.sql` (`index_key, date, value`) computed by a cron in
  `scripts/`.
- **UI**: per-bag "trades at **X%** vs. retail" stat near the value summary on the
  bag page; a **"Bags Above Retail" / "Top Performers"** board on `/closets` (or a
  new `/market`); an index line-chart (reuse the upgraded `PriceTrend` SVG).

**Verify (live DB):** with sufficient `price_history`, confirm retention math vs.
hand-computed examples, leaderboard ordering, and that bags with too few sales are
excluded (no misleading single-sale "retention").

---

## Suggested execution order (together, against a live DB)
1. **0013 XP economy** (unlocks Top Contributors + ladder; cheap, high-engagement).
2. **0014 Listopia** (evergreen SEO surfaces; self-contained).
3. **Resale ingestion pipeline** (the shared dependency) → then **0015 durability**
   and **#21 retention/index** light up together.

Each migration is human-gated: apply in order, run the existing seed/smoke path
(`docs/handoff.md`), and verify with the per-item checks above before shipping.
