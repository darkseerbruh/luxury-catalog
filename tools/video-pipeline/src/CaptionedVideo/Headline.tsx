import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY } from "../load-font";

// A persistent title pinned at the top. Sits on a soft dark scrim so it stays
// legible over a bright background. Fades in over the first few frames. An optional
// `cta` line (e.g. a URL) appears under it at `ctaSec` and stays.
export const Headline: React.FC<{
  readonly title: string;
  readonly subtitle?: string;
  readonly cta?: string;
  readonly ctaSec?: number;
  readonly yPct?: number;
}> = ({ title, subtitle, cta, ctaSec, yPct = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaEnter = interpolate(
    frame,
    [(ctaSec ?? 1e9) * fps, (ctaSec ?? 1e9) * fps + 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: `${yPct}%`,
          maxWidth: "88%",
          opacity: enter,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          padding: "14px 24px",
          borderRadius: 18,
          background: "rgba(14,13,12,0.5)",
          border: "1px solid rgba(201,162,76,0.35)",
        }}
      >
        <div
          style={{
            fontFamily: CAPTION_FONT_FAMILY,
            fontWeight: 700,
            fontSize: 52,
            lineHeight: 1.05,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            textAlign: "center",
            color: BRAND.captionColor,
            textShadow: BRAND.captionShadow,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontFamily: CAPTION_FONT_FAMILY,
              fontWeight: 500,
              fontSize: 28,
              lineHeight: 1.1,
              textAlign: "center",
              color: "#e3c785",
              textShadow: BRAND.captionShadow,
            }}
          >
            {subtitle}
          </div>
        ) : null}
        {cta ? (
          <div
            style={{
              fontFamily: CAPTION_FONT_FAMILY,
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: 0.5,
              marginTop: 2,
              color: BRAND.activeWordColor,
              textShadow: BRAND.captionShadow,
              opacity: ctaEnter,
              transform: `translateY(${(1 - ctaEnter) * -8}px)`,
            }}
          >
            {cta}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
