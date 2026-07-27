-- Luxury Catalog: "the ones you actually reach for", captured by periodic check-in.
--
-- WHY (owner, 2026-07-26): which bags get used and which sit is genuinely valuable
-- data, and nothing else on the site captures it. Fragrantica asks with a "wearing
-- today" log, and the owner named exactly why that fails: *"I never populate the
-- wearing today until I log in once or whenever."* A daily log only ever collects
-- data from the handful of people who log in daily.
--
-- So: NOT a daily log. A check-in every few months, or when someone comes back after
-- a while. "Are you still reaching for these? Has anything changed?" One pass over
-- the bags they own, a few taps, done.
--
-- The concept underneath is what the owner called the bag you grab without thinking.
-- Perfume people have a word for this and bag people have the same behaviour without
-- a name for it. It is consistent per person and it is a much better signal of a bag
-- being GOOD than a star rating, because it is revealed by behaviour rather than
-- stated in a form.
--
-- Naming note: "workhorse" was rejected by the owner (it reads as a laptop bag) and
-- "favourites" overlaps the existing Four Grails. The user-facing language is
-- "the ones you reach for".
--
-- SHAPE: current state on closet_item, prompt timing on profile. Deliberately not a
-- full event log yet — most_worn_set_at answers "is this still true, and since when"
-- which is what the check-in needs. A history table can come later if we want trend.

begin;

alter table closet_item add column if not exists most_worn boolean not null default false;
alter table closet_item add column if not exists most_worn_set_at timestamptz;

comment on column closet_item.most_worn is
  'Owner says this is one they actually reach for. Set during a periodic check-in, '
  'never a daily log. Behavioural signal, and a better read on whether a bag is good '
  'than a star rating because it is revealed rather than stated.';
comment on column closet_item.most_worn_set_at is
  'When most_worn was last affirmed or cleared, so a check-in can ask "still true?" '
  'and so a stale flag can be aged out rather than trusted forever.';

-- Drives the bag-page count ("N owners reach for this one") without scanning.
create index if not exists closet_item_most_worn_idx
  on closet_item (variant_id) where most_worn;

-- Prompt timing. Nullable: a member who has never been asked is due as soon as they
-- own enough bags for the question to mean anything.
alter table profile add column if not exists last_worn_checkin_at timestamptz;

comment on column profile.last_worn_checkin_at is
  'When this member last completed a most-worn check-in. Null means never asked. '
  'The cadence is months, not days: a daily prompt would collect data only from '
  'daily visitors and annoy everyone else.';

commit;
