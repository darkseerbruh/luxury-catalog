-- 0035_closet_want_spec.sql
-- "Any green / any colourway" saves.
--
-- A want can be saved at three breadths, all on the same closet_item row (the
-- variant the user was looking at stays as the representative + link to the style):
--   * exact         → want_spec IS NULL (the default; the heart saves this)
--   * a colour family → want_spec = {"colorFamily":"Green"}   (any green of this style)
--   * any colourway → want_spec = {"anyColor":true}           (any version of this style)
--
-- Keeping the representative variant_id means no nullable-variant refactor and the
-- existing unique(user_id, variant_id) still holds. The app degrades gracefully
-- until this is applied: reads/writes fall back to an exact (variant-level) want.

alter table closet_item
  add column if not exists want_spec jsonb;
