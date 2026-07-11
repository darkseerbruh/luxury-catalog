-- Luxury Catalog: persisted item-classification for every price_history row.
--
-- WHY: bag-vs-accessory was never STORED. A listing's "is this the bag or a card
-- holder / camera case / iPad case" was judged only by keyword heuristics at ingest
-- time (src/lib/ingest/model-normalize.ts), so anything that slipped those checks
-- attached to a real bag's variant and then, being cheap, WON the "Priced well today"
-- rail under the bag's name and linked out to the wrong object (owner report,
-- 2026-07-11). We fixed the READ side (deals.ts + listings.ts now drop foreign rows
-- via the shared classifier) and RE-POINTED the historical contamination off bag
-- variants (supabase/ingest/detect-listing-discrepancies.ts). This column makes the
-- classification PERSISTENT + auditable so the fix can't silently regress:
--
--   * item_class — one of:
--       'bag'         a real bag of this variant's style (the default / normal case)
--       'accessory'   a non-bag SLG / tech case / shoe / jewelry (card holder, iPad
--                     case, camera case, boots, necklace…) mis-attached to a bag
--       'wrong_model' a real bag whose title names a DIFFERENT known model than the
--                     style it sits under (e.g. a Camera Bag filed under Boy)
--       'unknown'     not yet classified
--     NULL = legacy / not-yet-tagged → readers TREAT AS 'bag' (show it), so nothing
--     disappears before a tagging pass runs. The deals rail + shop already exclude
--     foreign rows by title at read time, so this column is a durable record + a
--     cheap filter, not the only line of defense.
--
-- FORWARD USE (after apply): supabase/ingest/detect-listing-discrepancies.ts --tag
-- stamps this column from the shared classifier (non-destructive alternative to the
-- re-point), and a scheduled data-health run keeps it fresh. Ingest can then set it
-- at write time and readers can filter `item_class in ('bag') or item_class is null`.
--
-- HUMAN-GATED MIGRATION — like 0021–0052, NOT applied or runtime-tested by the
-- authoring session (no Supabase credentials). Apply via GitHub → Actions →
-- "Apply database migrations" → Run workflow (blank input), after 0052.
--
-- Additive + nullable, so the app keeps working before it is applied:
--   * new column is nullable → existing inserts/seeds unaffected;
--   * readers treat NULL as 'bag', and the title-based read guards already protect
--     the rail/shop, so behavior is unchanged until a tagging pass populates it.

alter table price_history add column if not exists item_class text;

alter table price_history drop constraint if exists price_history_item_class_chk;
alter table price_history add constraint price_history_item_class_chk
  check (item_class is null or item_class in ('bag', 'accessory', 'wrong_model', 'unknown'));

comment on column price_history.item_class is
  'Persisted bag-vs-foreign classification for this listing: bag | accessory | wrong_model | unknown. '
  'NULL = not yet tagged, treated as bag by readers. Set by detect-listing-discrepancies.ts --tag and '
  'by ingest going forward. Guards the deals rail + shop against re-contamination (owner report 2026-07-11).';

-- Fast lookup of the contamination that still needs review (small partial index —
-- indexes only the non-bag rows, which are a tiny fraction of ~120k).
create index if not exists idx_price_history_item_class_foreign
  on price_history (variant_id)
  where item_class in ('accessory', 'wrong_model');
