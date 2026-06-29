-- Luxury Catalog: persona model v2 (motivations + behavior-derived maturity)
--
-- Implements docs/personas.md §4 and docs/analytics-strategy.md G1: replace the
-- single forced-choice persona with an Axis-B *motivation* multi-select, and add
-- a behavior-derived Axis-A *maturity stage*.
--
-- Back-compat: the existing `profile.persona` (user_persona enum) column is KEPT
-- and still populated (a best-effort primary derived from the chosen motivations),
-- because ~10 readers across personalization + the profile UI depend on it. This
-- migration is purely additive; applying it cannot break existing reads.
--
-- Apply after 0036_style_story.sql. (Renumbered from 0035 to 0037 on 2026-06-29:
-- 0035 was already taken by 0035_closet_want_spec.sql, which is recorded as applied
-- in the remote DB, so `supabase db push` would have skipped this file as a version
-- collision. Renumber the UNAPPLIED duplicate, never the one already recorded.)

-- Axis-B motivations the user self-selects at onboarding (pick all that apply).
-- Free text array rather than an enum so the verb set can evolve without a
-- migration; the app validates against lib/maturity.ts MOTIVATIONS.
alter table profile
  add column if not exists motivations text[] not null default '{}';

-- Axis-A maturity, DERIVED from behavior (closet state today), never asked.
-- Nullable: null = not yet computed. Values: appreciate | aspire | first-purchase
-- | collector (reseller is deferred until sell signals exist; see analytics-strategy §6).
alter table profile
  add column if not exists maturity_stage text;

comment on column profile.motivations is
  'Axis-B motivations (onboarding multi-select): carry|value|authenticate|resell|collect. See docs/personas.md §4.';
comment on column profile.maturity_stage is
  'Axis-A maturity, derived from closet/behavior (not asked): appreciate|aspire|first-purchase|collector. See docs/analytics-strategy.md G1.';
