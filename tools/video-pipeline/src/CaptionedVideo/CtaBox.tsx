import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY } from "../load-font";

// A big standalone call-to-action box (e.g. the site URL) that pops in when she
// starts saying it and stays. Its own box, separate from the headline.
export const CtaBox: React.FC<{
  readonly text: string;
  readonly atSec: number;
  readonly yPct?: number;
}> = ({ text, atSec, yPct = 21 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const local = frame - Math.round(atSec * fps);
  const pop = spring({ frame: local, fps, config: { damping: 12, mass: 0.6 }, durationInFrames: 14 });
  if (local < 0) return null;

  // gentle continuous pulse after it lands
  const pulse = 1 + 0.02 * Math.sin((local / fps) * 3.2);
  const scale = interpolate(pop, [0, 1], [0.72, 1]) * pulse;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: `${yPct}%`,
          opacity: pop,
          transform: `scale(${scale})`,
          padding: "20px 36px",
          borderRadius: 22,
          background: "rgba(14,13,12,0.92)",
          border: "3px solid #c9a24c",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            fontFamily: CAPTION_FONT_FAMILY,
            fontWeight: 700,
            fontSize: 76,
            letterSpacing: 1,
            color: "#e3c785",
            textShadow: BRAND.captionShadow,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
