-- 0034_taste_quiz_result.sql
-- Persist the redesigned "Style read" quiz.
--
-- taste_quiz     = the raw answers (occasions + per-attribute Love/Fine/Not + logo).
-- taste_identity = the computed feeling read ({ headline, read, tags }), so the
--                  profile can show it without recomputing.
--
-- Separate from 0007's taste_vector/taste_completeness (the old recommendation
-- signal), which stays. The app degrades gracefully until this is applied: the
-- quiz still shows the result, it just isn't saved server-side yet.

alter table profile
  add column if not exists taste_quiz jsonb,
  add column if not exists taste_identity jsonb;
