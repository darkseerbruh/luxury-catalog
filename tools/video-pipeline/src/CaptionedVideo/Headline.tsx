import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY } from "../load-font";

// A persistent title pinned at the top. Sits on a soft dark scrim so it stays
// legible over a bright background. Fades in over the first few frames.
export const Headline: React.FC<{
  readonly title: string;
  readonly subtitle?: string;
  readonly yPct?: number;
}> = ({ title, subtitle, yPct = 4 }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
      </div>
    </AbsoluteFill>
  );
};
