# Proposal: a video layer for "The Story"

*Status update (greenlit): the video capability is now BUILT and on the branch.
`StoryVideos.tsx` renders curated YouTube facades plus per-intent search link-outs;
attributable clips are seeded for Birkin (60 Minutes, Harper's BAZAAR), Neverfull
(Louis Vuitton), and Lady Dior (LUXE.TV). The plan below is the rationale and the
path to expand curation. The original proposal text follows.*

*Status: proposal only. Owner greenlight required before any build. The shipped
"The Story" module (`src/lib/bag-stories/`, `BagStory.tsx`) currently carries cited
text tidbits, the people strip, a self-updating market fact, and a "Watch" link-out
to YouTube search. This doc proposes turning that link-out into a real, curated,
embedded video layer. Companion: `docs/social-embed-strategy.md`.*

## The idea

Spotify's card pairs the written blurb with media. The richest version of "The Story"
does the same: alongside each bag's origin and design tidbits, surface a small,
curated set of real videos:

- **Designer / creative-director interviews** (the maker explaining intent).
- **Runway and behind-the-scenes** clips of the bag's debut season.
- **House archival films** (heritage, craft, the workshop).
- **Trusted in-hand reviews** (already live in the "Video reviews" section).

So a Birkin page could show the airplane-sketch tidbit next to an interview clip; a
Marmont page could show Alessandro Michele on the archival Double G.

## Why it is a proposal, not a build

The text tidbits ship now because each one traces to a cited source. **Video must clear
a higher bar before it ships**, for three honest reasons:

1. **Never-invent.** We can only embed a *specific, verified* video. We must confirm each
   video id by hand at curation time; we cannot auto-generate or guess them. (Same rule
   that keeps us from seeding unverified Instagram post URLs.)
2. **Rights.** YouTube embedding via the standard player is permitted by YouTube's terms
   and is already implemented. Instagram is permission-first and needs the gated Meta
   oEmbed token (see `social-embed-strategy.md`). So the safe v1 is YouTube-only.
3. **Curation cost.** Each bag needs a person to find, watch, and vet a few clips. That is
   real editorial work, not a script. It should be a deliberate, owner-approved pass.

## What we already have (the build is small)

- `creator` + `resource` data model (migration `0004`) and `Resources.tsx` already render
  embedded YouTube behind a click-to-load facade on every bag page.
- `src/lib/youtube.ts` parses ids and builds privacy-enhanced `youtube-nocookie` embeds.
- The story module sits directly above the video section, so they read as one block.

So the work is **content + a thin presentation tweak**, not new infrastructure.

## Proposed approach (when greenlit)

| Option | What it is | Honesty / rights fit | Effort | Note |
|---|---|---|---|---|
| **A. Curated YouTube embeds, by category (Recommended)** | Add `interview` / `runway` / `archival` resource types; hand-vet a few real videos per hero bag; render them inside "The Story" grouped by type | Strong. YouTube embedding is permitted; every id is human-verified | Medium, per-bag curation | Best balance; reuses all existing plumbing |
| **B. Keep the link-out only** | Leave today's "Watch interviews and runway" search link as-is | Strong, nothing to verify | None | Already shipped; safe fallback |
| **C. Add Instagram clips too** | Bring in reels via the official oEmbed | Permission-first; needs the gated Meta token + written creator permission | Higher | Defer until the Meta app is approved (already gated) |

## Recommended path

Ship **Option A as a curated pass on the marquee icons first** (the same set we just
seeded text for), once you greenlight the editorial time. Concretely:

1. Extend the `resource_type` enum with `interview` / `runway` / `archival` (one small
   migration), or reuse the existing `youtube` type with a `category` tag to avoid a
   migration. (Recommended: the tag, no migration.)
2. Curate three to five verified YouTube clips per hero bag and attach them to the style.
3. Render them inside "The Story," grouped by category, using the existing facade card.
4. Keep Instagram gated until the Meta oEmbed token and creator permissions are in place.

## Metric

Engagement first: video is the single strongest dwell-time lever, and it deepens the page
without slowing first load (the facade only loads the player on click). Secondary GEO lift
(richer, longer pages). Monetization stays indirect: more time on the bag page, closer to
the buy/sell CTA, plus it strengthens creator partnerships (our non-cash currency).

## To greenlight, you decide

- Whether to spend the editorial time to curate clips (the real cost).
- Which bags first (default: the 23 we just seeded text for).
- YouTube-only to start (Recommended), or wait to bundle Instagram once the Meta token lands.
