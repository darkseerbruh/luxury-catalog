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
   `/social` and never changes. It lists video articles newest-first, each card
   showing its search key, driven by the same registry.
3. **IG comment-keyword DM automation (later).** Paid tool, outward-facing
   signup; revisit when IG engagement justifies it. Not built.

**Metric:** social → site click-through (PostHog `search_performed` with
`social_key` set = a viewer typed a key from a video; `/social` landings =
bio-link path).

## Key rules

- Lowercase, 1 to 3 words, letters/digits/spaces only. It must survive being
  spoken aloud and typed back from memory ("chanel 2026", "lv nine").
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
