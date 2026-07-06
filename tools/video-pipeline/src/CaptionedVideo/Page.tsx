import { makeTransform, scale, translateY } from "@remotion/animation-utils";
import { TikTokPage } from "@remotion/captions";
import { fitText } from "@remotion/layout-utils";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY, CAPTION_SERIF_FAMILY } from "../load-font";

// A restrained, editorial caption: cream text, gold on the active word, soft
// shadow instead of the loud default black stroke. Tuned in src/brand.ts.
export const Page: React.FC<{
  readonly enterProgress: number;
  readonly page: TikTokPage;
  readonly captionFontPx?: number;
}> = ({ enterProgress, page, captionFontPx }) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  const fitted = fitText({
    fontFamily: CAPTION_FONT_FAMILY,
    text: page.text,
    withinWidth: width * BRAND.captionWidthFraction,
    textTransform: BRAND.uppercase ? "uppercase" : "none",
  });
  // Text-card mode: a fixed size so the whole hook wraps onto one screen.
  // Default mode: auto-fit the short spoken caption as before.
  const isCard = typeof captionFontPx === "number";
  const fontSize = isCard
    ? captionFontPx
    : Math.min(BRAND.maxFontSizePx, fitted.fontSize, BRAND.fontSizePx);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        top: isCard ? 0 : undefined,
        // Card mode: center the hook in the upper region so a big block clears
        // the footer that sits in the lower third.
        bottom: isCard ? 560 : BRAND.bottomOffsetPx,
        height: isCard ? undefined : 220,
        paddingLeft: 48,
        paddingRight: 48,
      }}
    >
      <div
        style={{
          fontSize,
          fontFamily: isCard ? CAPTION_SERIF_FAMILY : CAPTION_FONT_FAMILY,
          fontWeight: isCard ? 700 : BRAND.fontWeight,
          letterSpacing: isCard ? 0 : BRAND.letterSpacingPx,
          textAlign: "center",
          lineHeight: isCard ? 1.25 : 1.15,
          maxWidth: isCard ? width * BRAND.captionWidthFraction : undefined,
          color: BRAND.captionColor,
          textShadow: BRAND.captionShadow,
          textTransform: BRAND.uppercase ? "uppercase" : "none",
          transform: makeTransform([
            scale(interpolate(enterProgress, [0, 1], [0.92, 1])),
            translateY(
              interpolate(enterProgress, [0, 1], [BRAND.captionRisePx, 0]),
            ),
          ]),
        }}
      >
        {page.tokens.map((t) => {
          const startRel = t.fromMs - page.startMs;
          const endRel = t.toMs - page.startMs;
          const active = startRel <= timeInMs && endRel > timeInMs;
          return (
            <span
              key={t.fromMs}
              style={{
                display: "inline",
                whiteSpace: isCard ? "pre-wrap" : "pre",
                // Card mode: one uniform static style (no per-word gold sweep).
                color: !isCard && active ? BRAND.activeWordColor : BRAND.captionColor,
                transition: "color 0.1s",
              }}
            >
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
