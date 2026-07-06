// Luxury Catalog brand tokens, mirrored from src/app/globals.css so captions read
// on-brand instead of the loud default TikTok style. Change here to restyle every video.

export const BRAND = {
  // Text
  captionColor: "#f3ede0", // --color-foreground (warm cream)
  activeWordColor: "#c9a24c", // --color-gold (accent on the word being spoken)
  // A soft shadow reads far more premium than the default fat black stroke.
  captionShadow: "0 2px 18px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.7)",

  // Layout
  fontSizePx: 76, // restrained, not the default 120
  maxFontSizePx: 84,
  captionWidthFraction: 0.82, // of video width
  bottomOffsetPx: 300, // distance from bottom of the 1920px canvas
  letterSpacingPx: 0.5,
  fontWeight: 600,
  uppercase: false, // sentence case reads more editorial than SHOUTING

  // Motion (subtle = luxury)
  zoomIntensity: 0.06, // slow Ken Burns: 1.0 -> 1.06 over the clip
  captionRisePx: 28, // how far each caption rises as it enters

  // Accessibility (text-card reels) — see docs/video-accessibility.md.
  // Cream text is light, so it MUST sit on a dark backing; a shadow alone fails
  // over bright footage. These floors are enforced in code, not by eyeballing.
  minCardCaptionPx: 46, // no on-screen text smaller than this at 1080x1920
  minCardHeadlinePx: 56, // the lead hook line
  // A tight dark halo + soft glow so edges hold even mid-transition.
  cardTextShadow:
    "0 0 4px rgba(0,0,0,0.92), 0 0 12px rgba(0,0,0,0.55), 0 2px 3px rgba(0,0,0,0.9)",
  // Soft dark ellipse painted behind a text block (feathers to transparent so it
  // reads as a vignette, not a hard box). Guarantees contrast on any clip.
  cardTextBacking:
    "radial-gradient(ellipse 80% 84% at 50% 50%, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.46) 52%, rgba(0,0,0,0) 100%)",
  // A gentle full-frame scrim under everything for a consistent base.
  cardScrim:
    "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 38%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.12) 100%)",
} as const;
