# Text-card reel rules — legibility, format, per-type layout

*NON-NEGOTIABLE. Applies to the "one clip + text on screen" text-hook reels rendered
with `tools/video-pipeline/scripts/montage-card.mjs`. Enforced in code
(`src/brand.ts`, `CardStack.tsx`, `CardFooter.tsx`); this doc is the why + the
pre-delivery checklist. Pairs with `docs/tiktok-swipe-file.md` (what to write) and
the `video` skill (how to run it).*

## 1. Accessibility (hard rules)

- **Minimum on-screen text: 46px** at 1080x1920. The lead hook line is **≥ 56px**.
  Enforced by `BRAND.minCardCaptionPx` / `minCardHeadlinePx`, clamped in
  `CardStack`. The only thing allowed smaller is a `hint` line like "(more in
  caption)" (floor 34px); never body or content text.
- **Never rely on the shadow alone.** Cream text is light, so light-on-light (cream
  over pale sky/water) is the failure mode we are fixing. Every text block AND the
  footer sit on a dark backing (`BRAND.cardTextBacking`), over a full-frame scrim
  (`BRAND.cardScrim`), with a tight dark halo (`BRAND.cardTextShadow`).
- **Verify on the BRIGHTEST frame, not an average one.** Pull a frame over the
  palest part of the clip and confirm the text is clearly readable before
  delivering.
- **Prefer darker, less-busy footage** for text-heavy cards.
- **Stay inside the side safe zone.** The platform's right-side action rail (avatar,
  like/comment/save) and the mid-right profile bubble sit on top of the frame, so
  text AND its dark backing box must clear both edges. Keep every block in the
  center ~66%: reserve **≥ 180px (~17%) on each side at 1080 wide**, card centered.
  Enforced by `BRAND.cardSideSafePx` / `cardMaxWidthPx` (720px max block width) in
  `CardStack`. Evidence for the tighter margin: two 2026-07-07 screenshots where the
  old 940px box (edge at 93.5% of width) ran the hook and the backing box straight
  into the avatar and action buttons.

## 1a. Safe zone — EVERY video, every format (hard rule)

*Applies to ALL vertical 1080x1920 videos we produce — montage cards, talking-head
reels, and hand-composited edits alike, not just the code-enforced card stack. The
app UI paints on top of the frame; anything outside the safe box gets clipped.*

- **Bottom:** nothing critical below **y1400**. TikTok's caption + sound row and IG's
  caption live in the bottom ~420px. Lower-third graphics (chips, value ladders,
  footers) end by y1400; captions go in the **center band, not the lower third**.
- **Right rail:** nothing critical **right of x900 below y~620** — profile, like,
  comment, save, share, sound disc. **List / recap thumbnails go on the LEFT**, never
  the right rail.
- **Top:** keep critical content below **y150**.
- A picture-in-picture may use the top-right corner **above y~620**, kept left of
  x1040.
- **Verify, don't assume:** before delivering ANY render, pull frames and overlay the
  TikTok unsafe zones (right rail + bottom strip) to confirm clearance. Evidence for
  this rule: two 2026-07-14 screenshots where bottom chips hid under the caption and
  the recap thumbnails sat under the right action rail.

## 2. Format (the look)

- **One short clip (5-7s), held the whole time.** No cutting between clips.
- **Text on screen from frame 0. No pop-in / entrance animation.**
- **Playfair serif** (the site's `--font-serif`), one uniform style. NOT Poppins,
  and NOT the per-word gold caption sweep (that is talking-head reels only).
- **Footer on every card:** gold diamond + *know the facts on every bag* + FOLLOW
  ALONG + the `luxurycatalog.com` pill. Sits in the lower third, lifted off the
  very bottom so it clears TikTok's caption and right-side action buttons.
- Hook centered in the upper-middle so bigger text clears the footer, and inside the
  side safe zone (§1) so it clears the right-side action rail and avatar.

## 3. Per-post-type layout

- **Tips-in-caption** ("I wish someone had told me…", how-to, listicles whose detail
  is long): headline on screen + a small **"(more in caption)"** hint under it. The
  tips live in the post caption.
- **"Hills I will die on"** (and any on-page list): put the **bulleted list ON the
  page** under the headline. Bullets smaller than the headline (but ≥ 46px), with
  gold-diamond markers.
- **Confessional** (e.g. the "junkie" post): stack the lines with **shrinking size**
  for emphasis.
- **Value / resale reframe:** real, sourced numbers only; refresh the range before
  posting (resale is live inventory).

## 3b. Footage selection

- **No people walking into frame.** Scan the whole clip window; if someone enters
  (even at the very end), trim the segment to a clean window or pick another clip.
- **Match motion to the message.** For calm/confessional posts, pick a **low-motion
  window** (measure it: `fps,tblend=difference,signalstats` YAVG per second, choose
  the lowest) and drop the Ken Burns push (`zoom` ~0.01). Never a jarring/spinning
  shot under reflective copy.
- **Keep text off a centered subject.** If the hero of the clip is centered (a bag on
  a chair), set `pos:"top"` so the text sits at the top and the subject stays the
  focus.

## 4. Pre-delivery checklist

1. Brightest-frame readability (contrast holds).
2. All content text ≥ the floor.
3. Text present at frame 0 (no pop-in).
4. Footer clears the bottom UI zone.
5. Text + backing box clear the side safe zone — nothing touches the right-side
   action rail or the avatar (§1).
6. Hooks are **verbatim** to her line (never trimmed — see the copy rules).
7. **Safe-zone red-check (all formats, §1a):** overlay the TikTok right rail + bottom
   caption zones on sampled frames and confirm every graphic clears them — bottom
   content above y1400, thumbnails on the left, nothing under the right rail.
