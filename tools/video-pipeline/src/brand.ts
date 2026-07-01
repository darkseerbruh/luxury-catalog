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
} as const;
