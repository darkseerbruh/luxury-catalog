# Social → site routing standard

*Created 2026-07-02. How a viewer gets from a short-form video to the exact
article, at any publishing volume. Replaces "link in bio," which does not scale
past a handful of articles and is not clickable in TikTok captions anyway.
Owner decision 2026-07-02.*

## The system (three layers)

1. **Spoken search key (primary).** Every video closes on
   "luxurycatalog dot com, search *key*". An exact key match pins the article
   to the top of `/search` (registry: `src/lib/social-search-keys.ts`).
2. **Permanent bio hub (fallback).** The bio link on every profile points at
   `/social` and never changes. It is GRID-FIRST (the likeshop/NYT pattern,
   owner call 2026-07-03): a 3-column mirror of the profile the visitor just
   left, one square tile per video article in posting order, each wearing its
   search key. PER-POST STEP once a video is live: export its cover frame
   (owner-recorded footage only) to `public/social-covers/<key>.jpg` and set
   `cover` on the registry entry; until then the designed fallback tile
   (title + key) renders. PER-PLATFORM MIRRORS
   (owner call 2026-07-03: TikTok is the active channel and WILL diverge from
   Instagram). TikTok bio -> `/social/tiktok?utm_source=tiktok&utm_medium=bio`;
   Instagram bio -> `/social/instagram?utm_source=instagram&utm_medium=bio`;
   plain `/social` is the generic fallback forever. Each mirror pulls its OWN
   ordered/scoped tile set from the registry via `keysForPlatform(platform)`.

   HOW TO DIVERGE (edit `src/lib/social-search-keys.ts`, no schema change):
   - default (no `platforms` block) = post is on BOTH grids, in registry order.
   - `platforms: { tiktok: {} }` = TikTok only (Instagram skips it), e.g. a take
     you only cut for TikTok.
   - `platforms: { tiktok: { order: 0 }, instagram: {} }` = on both, floated to
     the top of TikTok, left in place on Instagram.
   - `platforms: { tiktok: { cover: "/social-covers/x.jpg" } }` = a TikTok-
     specific cover frame (per-platform vertical crops differ).
   Covers live in `public/social-covers/`; a per-platform `cover` overrides the
   shared one. The spoken-key search pin is platform-agnostic and unaffected.
3. **IG comment-keyword DM automation (later).** Paid tool, outward-facing
   signup; revisit when IG engagement justifies it. Not built.

**Metric:** social → site click-through (PostHog `search_performed` with
`social_key` set = a viewer typed a key from a video; `/social` landings =
bio-link path).

## Key rules

- Lowercase, 1 to 3 words, letters/digits/spaces only. It must survive being
  spoken aloud and typed back from memory ("chanel 2026", "lv nine").
- Default to the article's NATURAL topic words ("luxury diaper bags") so the CTA
  sounds like speech, not a code; invent a key only on collision (owner pattern,
  2026-07-02). Spoken formula: "Just search <key> on the site to read more." A
  trailing "Link in bio." tag is allowed as a SECONDARY pointer (the bio lands on
  /social); never bio-only.
- One key per article. A whole video series pointing at one article shares one
  key.
- Unique forever; keys are never reused for a different article.
- Assigned when the kit is drafted. Lives in TWO places, kept in sync: the
  Notion Content Kit (field: Search Key) and `src/lib/social-search-keys.ts`
  (what the site actually routes on; unit-tested for uniqueness/format).

## QA gate, in order, before a video is posted

1. Article is **published** on the site under the slug in the registry.
2. `/search?q=<key>` pins that article at the top ("From our videos" card).
3. The spoken CTA in the script matches the key exactly.

The registry skips unpublished slugs by design (no dead pins, no dead hub
cards), so shipping the key before the article is safe but the video is not
postable until the gate passes.
