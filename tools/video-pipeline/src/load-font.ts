// Loads the brand font (Poppins) at render time via @remotion/google-fonts,
// so there is no .ttf to vendor. Swap the import to another family to restyle.
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadPoppins("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export const CAPTION_FONT_FAMILY = fontFamily;
