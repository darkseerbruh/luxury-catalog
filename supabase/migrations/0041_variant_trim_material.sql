-- 0041: trim material as a first-class variant field.
-- Owner rule (2026-07-02): every detail that changes by bag is its own DB field
-- and a selectable dimension on the bag page. Trim was the one physical detail
-- still living only in free text (exterior_colorway / authentication_markers).
-- The app reads this column resiliently, so it degrades gracefully until applied.

alter table variant add column if not exists trim_material text;

comment on column variant.trim_material is
  'Trim/handle material when it differs from the body (e.g. Vachetta on LV coated canvas). Null = same as body or not yet captured.';

-- Backfill the Neverfull family (style 218). Source: our own catalogued
-- authentication notes on these rows (Monogram/Azur = untreated Vachetta;
-- Damier Ebene uses smooth darker leather trim, not Vachetta).
update variant set trim_material = 'Vachetta (natural cowhide)'
  where variant_id in (217, 218, 219, 221) and trim_material is null;
update variant set trim_material = 'smooth dark brown leather'
  where variant_id = 220 and trim_material is null;
