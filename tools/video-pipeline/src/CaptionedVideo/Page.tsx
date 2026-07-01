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
import { CAPTION_FONT_FAMILY } from "../load-font";

// A restrained, editorial caption: cream text, gold on the active word, soft
// shadow instead of the loud default black stroke. Tuned in src/brand.ts.
export const Page: React.FC<{
  readonly enterProgress: number;
  readonly page: TikTokPage;
}> = ({ enterProgress, page }) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  const fitted = fitText({
    fontFamily: CAPTION_FONT_FAMILY,
    text: page.text,
    withinWidth: width * BRAND.captionWidthFraction,
    textTransform: BRAND.uppercase ? "uppercase" : "none",
  });
  const fontSize = Math.min(BRAND.maxFontSizePx, fitted.fontSize, BRAND.fontSizePx);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        top: undefined,
        bottom: BRAND.bottomOffsetPx,
        height: 220,
        paddingLeft: 48,
        paddingRight: 48,
      }}
    >
      <div
        style={{
          fontSize,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: BRAND.fontWeight,
          letterSpacing: BRAND.letterSpacingPx,
          textAlign: "center",
          lineHeight: 1.15,
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
                whiteSpace: "pre",
                color: active ? BRAND.activeWordColor : BRAND.captionColor,
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
