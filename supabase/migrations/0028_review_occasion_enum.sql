-- Structure the free-text `review.occasion` into a closed set
-- (decision 2026-06-23, docs/ux/review-data-leaderboards.md). Unlocks the
-- night-out / work / travel community leaderboards by making the field rankable.
--
-- The column stays `text` (no type swap, so reads/writes are unchanged): we
-- best-effort backfill legacy free-text values into the five buckets, null out
-- anything we can't confidently map (never invent a category), then add a CHECK
-- constraint so only the canonical values (or null) can be written going forward.
-- Canonical set lives in src/lib/occasions.ts — keep the two in sync.
--
-- HUMAN-GATED + resilient: the app already enforces the closed set (the form only
-- emits these values, submitReview rejects others), so the feature works before
-- this runs. This migration adds DB-level enforcement and cleans up old rows.

-- 1. Backfill: map common free-text phrasings into the closed buckets. Order
--    matters — first match wins. Unmappable text becomes null (honest: we don't
--    guess a category from ambiguous input).
UPDATE review
SET occasion = CASE
  WHEN occasion IS NULL OR btrim(occasion) = '' THEN NULL
  WHEN occasion ~* 'work|office|profession|business|commut' THEN 'work'
  WHEN occasion ~* 'eveni|night|party|date|formal|dinner|cocktail|gala' THEN 'evening'
  WHEN occasion ~* 'travel|trip|vacation|holiday|airport|weekend|getaway' THEN 'travel'
  WHEN occasion ~* 'special|wedding|event|occasion|celebrat' THEN 'special'
  WHEN occasion ~* 'everyday|every day|daily|day[- ]?to[- ]?day|casual|errand' THEN 'everyday'
  ELSE NULL
END;

-- 2. Enforce the closed set (or null). Drop-then-add so a re-run / repair is safe.
ALTER TABLE review DROP CONSTRAINT IF EXISTS review_occasion_check;
ALTER TABLE review
  ADD CONSTRAINT review_occasion_check
  CHECK (occasion IS NULL OR occasion IN ('everyday', 'work', 'evening', 'travel', 'special'));
