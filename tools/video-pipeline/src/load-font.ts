// Loads the brand fonts at render time via @remotion/google-fonts, so there is
// no .ttf to vendor. Poppins = talking-head captions; Playfair Display = the
// editorial serif used on text-card reels (matches the site's --font-serif).
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily } = loadPoppins("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export const CAPTION_FONT_FAMILY = fontFamily;

const playfair = loadPlayfair("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});
// Italic faces (same family name) for the footer tagline.
loadPlayfair("italic", { weights: ["500", "600"], subsets: ["latin"] });
export const CAPTION_SERIF_FAMILY = playfair.fontFamily;
