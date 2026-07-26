-- Luxury Catalog: add the "tried it" shelf state and a reason for "had it".
--
-- WHY (docs/ux/bag-page-build-plan.md §2, owner-approved 2026-07-26):
--
-- 1. TRIED IT. want/have/had leaves out a large, useful group: people who have
--    held the bag in a store but never owned it. They are precisely the audience
--    deciding whether to buy, and today they have no honest way to contribute.
--    Their opinion on structure, access and dress code is real; their opinion on
--    how it ages is not, which the read layer can enforce per-axis later.
--
-- 2. WHY YOU NO LONGER HAVE IT. The owner corrected an earlier design that put
--    "sold it" on the sentiment scale: selling implies you LIKED it at some
--    point, so it is a behaviour, not a feeling. Moving it here separates the two
--    cleanly and captures far better signal. "Sold after five years" and
--    "returned it in a week" are different stories, and both say more than a low
--    star rating ever could.
--
--    `rented` matters specifically: with services like Vivrelle a member may have
--    carried a bag for a month and never owned it at all. Without this value that
--    person is either invisible or miscounted as a former owner.
--
-- Both are ADDITIVE and nullable. No existing row changes meaning, and the reason
-- is optional so it never becomes a toll on marking a bag as sold.
--
-- Note on ordering: `alter type ... add value` cannot be used in the same
-- transaction that adds it, so the enum change is deliberately left outside the
-- transaction below. Adding a value is safe to re-run behind the `if not exists`.

alter type closet_status add value if not exists 'tried';

begin;

alter table closet_item add column if not exists had_reason text
  check (had_reason is null or had_reason in (
    'sold', 'returned', 'gifted', 'rented', 'lost'
  ));

comment on column closet_item.had_reason is
  'Why a bag is no longer held. Only meaningful when status = had; optional so it '
  'never gates the status change. "rented" covers services like Vivrelle where the '
  'member carried the bag but never owned it, and would otherwise be miscounted as '
  'a former owner. Deliberately NOT a sentiment: selling implies you liked it once '
  '(owner correction, 2026-07-26).';

-- The shelf-count reads filter on status; this keeps the "had, and why" breakdown
-- cheap once the reason is populated.
create index if not exists closet_item_had_reason_idx
  on closet_item (variant_id, had_reason) where had_reason is not null;

commit;
