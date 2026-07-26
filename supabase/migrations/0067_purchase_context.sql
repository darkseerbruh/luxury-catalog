-- Luxury Catalog: private purchase context on a closet item.
--
-- TWO REASONS, one of them a data-integrity fix.
--
-- 1. RATINGS ARE UNINTERPRETABLE WITHOUT IT. The axis research found that a vintage
--    Classic Flap buyer at roughly $2,000 and a boutique buyer today at roughly
--    $10,800 rate the identical bag completely differently, especially on
--    price_value and worth_it_where. Averaging them produces a number that describes
--    nobody. Capturing the year and channel lets a reader filter to people who
--    bought the way they are about to.
--
-- 2. IT ANSWERS THE QUALITY-BY-YEAR QUESTION. Owners date their bags like vintages
--    (pre-2022 Polène, pre-2010 Chanel, thicker older Neverfull canvas). With a
--    purchase year attached to opinions, that pattern emerges from our own data
--    instead of staying folklore.
--
-- THE "ONE CANVAS" RULE (owner, 2026-07-26). She has tried and abandoned this kind
-- of feature elsewhere: *"there are so many places to record information about your
-- experience with a fragrance that I never remember where I wrote it down."* So
-- these columns are NOT a new surface. They join `closet_item.note` (which already
-- exists) on the ONE panel where everything you have said about a bag lives, with
-- public and private clearly marked. Never a separate "purchase log" page.
--
-- PRIVACY. Purchase price is the most sensitive thing we would hold about a member.
-- It is protected by the per-user RLS already on closet_item (0002), it is never
-- exposed on a public closet, and nothing reads it in aggregate today. If we ever
-- want "what people actually paid", that needs its own explicit opt-in and its own
-- review, not a quiet reuse of this column.

begin;

alter table closet_item add column if not exists purchase_year smallint
  check (purchase_year is null or (purchase_year >= 1950 and purchase_year <= 2100));

alter table closet_item add column if not exists purchase_channel text
  check (purchase_channel is null or purchase_channel in (
    'boutique', 'department_store', 'reseller', 'peer', 'gift', 'auction', 'rental'
  ));

alter table closet_item add column if not exists purchase_price numeric(10,2)
  check (purchase_price is null or purchase_price >= 0);

alter table closet_item add column if not exists purchase_currency text
  check (purchase_currency is null or char_length(purchase_currency) = 3);

comment on column closet_item.purchase_year is
  'Year the member acquired it. Makes their opinions interpretable: a vintage buyer '
  'and a boutique-today buyer rate the same bag differently. Also surfaces the '
  'quality-by-production-year pattern collectors already track informally.';
comment on column closet_item.purchase_channel is
  'How they got it. Closed set. Same purpose as purchase_year, and it separates '
  'someone who paid retail from someone who found it preloved.';
comment on column closet_item.purchase_price is
  'PRIVATE. What they paid. Protected by the per-user RLS on closet_item, never '
  'shown on a public closet, and read in aggregate by nothing. Any future aggregate '
  'use needs its own opt-in and its own review, not a quiet reuse of this column.';
comment on column closet_item.purchase_currency is 'ISO 4217 code for purchase_price.';

-- Supports "filter opinions to people who bought around when I am buying".
create index if not exists closet_item_purchase_year_idx
  on closet_item (variant_id, purchase_year) where purchase_year is not null;

commit;
