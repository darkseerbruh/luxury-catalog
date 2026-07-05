# Script requirements (video/voiceover)

*The owner's rules for every spoken script, consolidated from her edit passes of
2026-07-02. These are REQUIREMENTS, not suggestions. Every script is checked against this
list before it reaches a kit's TELEPROMPTER section. Supersedes the scattered notes in
content-kit-buildout.md (which now point here).*

## Voice and stance
1. **I, never we.** She is one person, not an org. "I track more than twenty thousand real
   prices." Written on-site copy may use brand voice; scripts are I/my.
2. **Friend, not brand.** She does not work for these houses and must never sound like she
   does. Never recite a product's virtues in her own words ("waterproof by design, spills
   wipe off" = brochure). Instead: start from the viewer's worry, attribute brand claims
   AS the brand's ("Goyard's own line is... their claim, not mine"), then deliver the
   nobody-tells-you truth from the buyer's side. (voice-and-tone.md Principle 3 + the
   "said like a friend, backed like an expert" model.)
3. **Opinions are labeled mine.** "My take, not a rule." Value = my estimate from dated
   comps, never an appraisal; markers to check, never verdicts.

## Structure
4. **The hook names the search intent in sentence one**, especially when the intent
   differs from the bag. A take targeting "louis vuitton diaper bag" opens with moms and
   diaper bags, not with the bag.
5. **One plain payoff, sayable in one breath.** No symmetrical if/if constructions (buyer
   case + seller case = two videos). No finance jargon ("anchor on").
6. **Credibility integrated at the data moment, never appended.** The identity/site
   mention attaches as a CLAUSE where the first number or checked claim appears ("the
   sales I actually track at Luxury Catalog", "I did what I built Luxury Catalog to do,
   and checked"). "I'm Arielle" rides the ending's site call or question, one short
   sentence max. No standalone "By the way, I'm Arielle..." paragraphs; a bolted-on
   sign-off is a defect. The twenty-thousand-prices claim stays verified (24,088 asking +
   1,665 sold as of 2026-06-26; re-check before raising) and appears at most once per
   video, ideally only in a series opener.
7. **Every script ends one of two ways:** a specific question for the comments, OR a site
   call carrying the kit's SEARCH KEY ("at Luxury Catalog dot com. Search chanel 2026.").
   The key comes from the routing registry (docs/social-routing.md +
   src/lib/social-search-keys.ts; one key per article, a series shares its article's key),
   never an ad-hoc bag term. Question-ending scripts still speak the key in the preceding
   site mention. Say the site name aloud at least once per series.

## Language
8. **Contractions always**: isn't, can't, don't, it's. Never "is not" / "cannot" / "it is".
9. **Numbers spoken in full with units**: "fourteen hundred and ninety-five dollars",
   never "fourteen ninety-five".
10. **A bag model always carries its full house name, every mention** (owner rule
    2026-07-02): "the Louis Vuitton Neverfull", never bare "the Neverfull", and never an
    abbreviation ("LV") in spoken copy. A list may share one brand ("the Louis Vuitton
    Pochette Accessoires, the Metis, and the Eva"); a size reference right after a full
    naming ("the PM") is fine. First jargon mention still gets the plain spell-out
    ("the bag called Neverfull, in the size MM").
11. **Complete sentences; no clipped fragments** ("It's heavier, though"). Soften
    absolutes ("Maybe the boring answer, but honest"). Finish every metaphor. Plain idioms
    over writerly ones. Less drama ("a significant gap", not "that's not a typo").
    **No AI rhetorical tics** (owner call 2026-07-02): "And honestly?", "Honestly," as an
    opener, "Let's be real". Cut the tic, keep the claim. Full blacklist:
    voice-and-tone.md §8; sweep every script against it before the teleprompter.
12. **One hedge per script maximum**, spoken naturally ("creators report", "their claim,
    not mine"). Don't stack "estimate not appraisal" onto "dated comps".
13. **No em dashes** (voice-and-tone.md; the tagline is the only exception, and it never
    appears in scripts).

## Facts and logistics
14. **Only verified, dated numbers are spoken.** Unfilled figures stay as [DATA: spec]
    slots; a script with a [DATA] slot is not teleprompter-eligible. [VERIFY]-flagged
    claims are spoken as hedges ("reported") or cut.
15. **No bags in hand.** Talking-head, green-screen, or data-on-screen only; a script may
    never ask her to show, open, or handle a bag.
16. **Single source of truth + lean kit pages:** a kit page contains exactly TWO things:
    one compact plan block (metric, article path, demand numbers, cadence, a pointer to
    this doc) and the 🎬 TELEPROMPTER section (spoken words only). No old drafts, no
    annotated versions, no sign-off blocks, no take outlines on the page. Draft/annotated
    scripts (including [DATA]-slotted episodes) live ONLY in the repo
    (docs/research-drafts/trend-articles/) and move to the page's TELEPROMPTER when they
    become fill-free. Never maintain two live copies of the same script.

17. **Every take ships as a POST PACKAGE**: script + caption + tag set, together. The
    caption is strategy, not garnish: it carries the target search phrase in plain text
    (TikTok search indexes captions), the date + n for any number spoken in the video, and
    the site pointer with the search term. Tags: 4-6, composed of the target term as a
    tag + the bag/brand tags + community tags we have OBSERVED in verification sweeps
    (#bagtok #pursetok #momtok etc.). Never invent a tag, never use a verified trap tag.
    Captions follow the same voice rules as scripts (I-voice, contractions, no em dashes).
    Kit pages hold these in a 📋 CAPTIONS + TAGS section; Metricool scheduling copies from
    there.

## Editing & render output (talking-head reels, owner rules 2026-07-03)
18. **Open on her first word.** Trim the leading dead air; the reel never opens on her
    sitting silent. (Whisper pads the silence into the first token, so the auto-trim can
    miss it. Pipeline honors `input/<base>.trim.json {"headSec":N}`; verify the opening
    frame.)
19. **Keep her spoken audio in the delivered file.** It is a lip-synced scratch track she
    lines the trending sound up against. Never deliver a talking-head reel silent
    ("silent by design" is montage-only).
20. **Audio stays synced to her mouth** (within ~1 frame / 40ms). Confirm the sync-mux
    offset before render; the phone's own audio is the ground truth for her lips.
21. **Captions must match the spoken audio, verified not assumed (bug fixed 2026-07-03).**
    `npm run sync` left the clean audio delayed as a container offset, so the render
    played it seconds late while Whisper timed captions to audio-at-zero: every caption
    ran ahead of her voice. The pipeline now bakes the offset into real samples
    (`aresample=async=1:first_pts=0`) and trims the silent lead BEFORE transcription so
    Whisper never hallucinates on it. Spot-check a mid-clip second: the burned caption
    must equal what she is saying in the audio there.
22. **Bag on screen carries its NAME near it (owner rule 2026-07-04).** Every cued bag
    card shows the bag's name (the cue's `label`). Exception: if a rank list already names
    each bag on screen, the pipeline suppresses the card label so it isn't doubled.
23. **Spoken price sits near the bag (owner rule 2026-07-04).** A dollar amount pops just
    under the card that's on screen when she says it. The card must still be up at the
    price, so let cards auto-hold until the next bag (no short fixed `hold` when the price
    for that bag comes later in the sentence).

## The pre-record checklist (run on every script)
- [ ] Intent named in sentence one
- [ ] I-voice throughout; zero we/our
- [ ] No brand-brochure lines; claims attributed
- [ ] One payoff, one breath
- [ ] Credibility beat present and script-specific
- [ ] Ends on a comments question or site call + search term
- [ ] Contractions, full spoken numbers, no fragments
- [ ] Every model mention carries the full house name (no bare models, no "LV")
- [ ] Max one hedge; no em dashes; no AI tics (voice-and-tone.md §8 blacklist); no [DATA]/[VERIFY] remaining
