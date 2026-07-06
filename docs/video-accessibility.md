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

## 2. Format (the look)

- **One short clip (5-7s), held the whole time.** No cutting between clips.
- **Text on screen from frame 0. No pop-in / entrance animation.**
- **Playfair serif** (the site's `--font-serif`), one uniform style. NOT Poppins,
  and NOT the per-word gold caption sweep (that is talking-head reels only).
- **Footer on every card:** gold diamond + *know the facts on every bag* + FOLLOW
  ALONG + the `luxurycatalog.com` pill. Sits in the lower third, lifted off the
  very bottom so it clears TikTok's caption and right-side action buttons.
- Hook centered in the upper-middle so bigger text clears the footer.

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
5. Hooks are **verbatim** to her line (never trimmed — see the copy rules).
