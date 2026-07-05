-- ============ Migration 0044: style.has_protective_feet ============
-- Adds "protective feet" as a first-class, style-level bag attribute.
--
-- Feet are a STYLE trait, not a per-variant one: a Kelly has four feet whatever
-- its leather or colour, a Classic Flap has none in any size. So the flag lives on
-- `style` (one row per bag design), the same altitude as silhouette / closure.
--
-- Nullable boolean on purpose — three honest states:
--   true  = documented to have protective feet,
--   false = documented to have none,
--   null  = unknown / not yet captured (never guess). Reviews crowd-fill it over time.
--
-- HUMAN-GATED + resilient: the app reads this column defensively. `getShopProducts`
-- probes for it and, if it is missing (pre-migration), simply omits the "Protective
-- feet" facet and keeps every other filter working — no crash. Owners can already
-- report feet in a review before this runs; those reports just have nowhere to
-- aggregate until the column exists.
--
--   APPLY THIS, THEN IT ACTIVATES: once this migration runs, the Shop "Protective
--   feet" facet appears automatically (Yes / Unknown), and review-reported feet
--   start landing on the style. Then run
--   `npx tsx supabase/seed/seed-protective-feet.ts --write` to seed the documented
--   hero styles.

alter table style add column if not exists has_protective_feet boolean;

comment on column style.has_protective_feet is
  'Does this bag design sit on protective metal feet? true = documented yes, false = documented no, null = unknown / not yet captured. Style-level trait (constant across a style''s variants). Crowd-filled by owner reviews over time.';

-- Owner-reported protective feet, carried on the review as a structured detail
-- (like worth_it / occasion). Nullable + optional: null = owner didn't say. This
-- is the crowd-fill INPUT; submitReview promotes a confident report up to
-- style.has_protective_feet so the catalog attribute grows from real owners.
alter table review add column if not exists reports_protective_feet boolean;

comment on column review.reports_protective_feet is
  'Owner-reported: does this bag have protective feet? true/false = they told us, null = not reported. Feeds style.has_protective_feet over time.';
