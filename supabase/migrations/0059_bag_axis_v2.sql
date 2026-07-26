-- Luxury Catalog: re-derive the opinion-axis vocabulary from evidence, then cut
-- it to the six things only an owner can tell us.
--
-- WHY: the original 0012 set was an a-priori adaptation of Fragrantica's model
-- (ux-research-brief.md §F), never checked against what handbag owners actually
-- discuss. A 2026-07-25 dimension-discovery pass across six bags spanning tiers
-- (Hermès Birkin, Chanel Classic Flap, Dior Lady Dior, Bottega Jodie, LV
-- Neverfull, Polène/Telfar mid-tier; ~100 owner-voice sources) rebuilt it.
-- Evidence: docs/research-drafts/axis-evidence-2026-07.md
-- Full field-by-field inventory: docs/review-ask-inventory.md
--
-- THE FILTER (owner, 2026-07-25): ask reviewers ONLY what we cannot learn
-- anywhere else. Treat it as qualitative data. Something can be important to
-- ANSWER on the bag page without being important to ASK a reviewer. A dimension
-- earns a slot only if it is longitudinal, bodily, behavioural, or social.
-- Properties of the object get derived from the catalog instead.
--
-- THE SIX THAT SURVIVED, and what each absorbed:
--   access       Fussy to get into ↔ Easy in and out.
--                Top functional complaint in the corpus (11 of 11 Lady Dior
--                sources; present in all six passes). Most Birkin owners carry
--                theirs hanging open because the hardware needs two hands.
--                SCOPE: access ease only. Security is derived from closure type
--                (zip / flap / turnlock / open), because those are two axes, not
--                one: an open tote is easy AND insecure. Niche-pocket quirks are
--                deliberately excluded, so one useless pocket cannot drag down an
--                otherwise accessible bag.
--   structure    Slouches ↔ Holds its shape.
--                All six passes; the Lady Dior pass called it "the most contested
--                dimension in the corpus". NOT derivable, and the tell is that
--                owners of the SAME bag disagree (Birkin owners split by leather;
--                Neverfull owners disagree on the observable fact). If owners
--                disagree, it is not a spec. Absorbs "standing up / setting it
--                down" and the spatial experience of a rigid bag catching on
--                people and shelves.
--   holds_up     Baby it ↔ Live in it.
--                Merges how-it-ages with upkeep (owner call: "how much do I baby
--                it" IS "how do I keep it from looking worn", and these bags have
--                no real maintenance regime beyond occasional leather cleaner).
--                Absorbs review.durability_rating, weather anxiety (can I set it
--                on a wet sink), and colour transfer from dark denim.
--   price_value  Way overpriced ↔ Great value.
--                Reinstated after being cut. The cut was right about OUR version
--                (a boolean duplicating the star rating) and wrong about the
--                question. Fragrantica's live data settles it: 3.76/5 overall while
--                5.5k members call the same fragrance "way overpriced" and 399 call
--                it great value. Those are demonstrably different opinions.
--   worth_it_where  Only worth it preloved ↔ Worth it at full retail.
--                Bag-native, no perfume equivalent, and arguably the most useful
--                value question in the category. Polar: "only worth it preloved" is
--                useful guidance, not a demerit.
--   dress_code   Casual ↔ Dressy.
--                5 of 6 passes and never resolved in any of them. A Neverfull
--                owner sold hers in five months because "it was a tote, not a
--                purse". Replaces `versatility`, which 5 of 6 passes flagged as
--                ambiguous (it meant carry-modes AND occasion-range AND
--                outfit-matching at once).
--
-- CUT, with reasons (the long form is in docs/review-ask-inventory.md):
--   versatility         ambiguous, three meanings at once
--   roomy_vs_compact    measures which variant the voter bought, not the bag
--   holds_value         a market fact we already hold in price_history
--   worth_the_price     a stand-in for the star rating, and contaminated by
--                       purchase channel and year
--   build_quality       ceilings out at the top tier (everyone scores a Birkin 5)
--                       and partly measures price resentment at Chanel
--   everyday_wearability  the OUTCOME of the others, not a peer
--   weight / balance    owner call: cut. Grams stay catalog data.
--   usable capacity     a fuzzy scale where readers want a specific answer
--                       ("does my laptop fit"). Belongs in specs + photos.
--   timelessness        heats and cools with time, so a static average is
--                       meaningless (Celine Luggage, Boy). Derivable as a TREND
--                       from our own price and listing volume instead.
--   recognisability     barely varies by owner, so asking every reviewer would
--                       collect the same value repeatedly. State it, do not ask.
--
-- The rate/describe split (unipolar judgement vs polar description) lives in
-- src/lib/axes.ts: it is display semantics, not storage.
--
-- SAFETY: written to run while bag_axis_vote is EMPTY (verified 0 rows in prod,
-- 2026-07-25). Postgres cannot drop an enum value in place, so the type is
-- swapped wholesale. Rows on a removed axis are deleted first and the count is
-- raised as a notice, so a later run is never silently lossy.

begin;

do $$
declare
  removed_count bigint;
begin
  delete from bag_axis_vote
   where axis::text not in ('access', 'structure', 'holds_up', 'dress_code',
                            'price_value', 'worth_it_where');
  get diagnostics removed_count = row_count;
  if removed_count > 0 then
    raise notice 'bag_axis v2: deleted % vote(s) on retired axes.', removed_count;
  else
    raise notice 'bag_axis v2: no votes on retired axes, clean swap.';
  end if;
end $$;

create type bag_axis_v2 as enum (
  'access',
  'structure',
  'holds_up',
  'dress_code',
  'price_value',
  'worth_it_where'
);

alter table bag_axis_vote
  alter column axis type bag_axis_v2 using axis::text::bag_axis_v2;

drop type bag_axis;
alter type bag_axis_v2 rename to bag_axis;

-- ---- Fold review.durability_rating into holds_up ----
-- One rating system, not two (owner call). durability_rating rendered as a
-- SECOND star-rating in a different table from every other scale. Each rating
-- becomes a holds_up vote by the same user on the same variant, keeping its
-- original timestamps. COPY, not move: the source column is left intact so this
-- stays reversible. `on conflict do nothing` makes the migration re-runnable and
-- lets an existing axis vote win over the older review field.
do $$
declare
  moved_count bigint;
begin
  insert into bag_axis_vote (user_id, variant_id, axis, value, created_at, updated_at)
  select user_id, variant_id, 'holds_up'::bag_axis, durability_rating, created_at, updated_at
    from review
   where durability_rating is not null
  on conflict (user_id, variant_id, axis) do nothing;
  get diagnostics moved_count = row_count;
  raise notice 'bag_axis v2: copied % durability rating(s) into holds_up.', moved_count;
end $$;

comment on column review.durability_rating is
  'SUPERSEDED 2026-07-25 by the holds_up axis on bag_axis_vote (migration 0059). '
  'Retained for reversibility; the app no longer writes it and the "Most durable" '
  'leaderboard now reads bag_axis_vote. Do not add new readers.';

comment on column review.worth_it is
  'RETIRED 2026-07-25 (owner call): in practice a stand-in for review.rating, and '
  'contaminated by purchase channel and year (a vintage buyer and a boutique buyer '
  'answer different questions). Retained for existing data; no longer collected.';

commit;
