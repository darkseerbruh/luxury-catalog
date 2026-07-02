import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY } from "../load-font";

// A row of rank chips that fill in as each place is revealed. Each chip lights up
// gold at its fill time and stays lit, so the countdown "fills in as she talks".
export const RankTracker: React.FC<{
  readonly labels: string[];
  readonly fillTimes: number[]; // seconds, one per label
  readonly yPct?: number;
}> = ({ labels, fillTimes, yPct = 12 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: `${yPct}%`,
          display: "flex",
          gap: 22,
        }}
      >
        {labels.map((label, i) => {
          // 0 before this rank's moment, springs to 1 just after.
          const p = spring({
            frame: frame - Math.round((fillTimes[i] ?? 1e9) * fps),
            fps,
            config: { damping: 12 },
            durationInFrames: 10,
          });
          const size = 92;
          return (
            <div
              key={i}
              style={{
                width: size,
                height: size,
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: CAPTION_FONT_FAMILY,
                fontWeight: 700,
                fontSize: 46,
                color: p > 0.5 ? BRAND.captionColor : BRAND.captionColor,
                // Empty: faint outline. Filled: gold, with a soft glow + pop.
                border: `3px solid ${BRAND.activeWordColor}`,
                background: `rgba(201,162,76,${0.92 * p})`,
                boxShadow: p > 0 ? `0 8px 26px rgba(201,162,76,${0.5 * p})` : "none",
                transform: `scale(${1 + 0.12 * p * (1 - p) * 4})`,
                textShadow: BRAND.captionShadow,
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
