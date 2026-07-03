import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY } from "../load-font";

// A number/stat that pops on screen when it is spoken (e.g. a dollar amount), holds
// briefly, then fades. Auto-generated from dollar amounts in the transcript.
export const StatCallout: React.FC<{
  readonly text: string;
  readonly atSec: number;
  readonly hold?: number;
  readonly xPct?: number;
  readonly yPct?: number;
}> = ({ text, atSec, hold = 2.6, xPct = 74, yPct = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - Math.round(atSec * fps);
  const dur = Math.round(hold * fps);
  if (local < 0 || local > dur + 8) return null;

  const pop = spring({ frame: local, fps, config: { damping: 12, mass: 0.6 }, durationInFrames: 12 });
  const exit = interpolate(local, [dur - 8, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(pop, [0, 1], [0.7, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: `${yPct}%`,
          left: `${xPct}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: Math.min(pop, exit),
          padding: "14px 26px",
          borderRadius: 18,
          background: "rgba(14,13,12,0.92)",
          border: "3px solid #c9a24c",
          boxShadow: "0 16px 44px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            fontFamily: CAPTION_FONT_FAMILY,
            fontWeight: 700,
            fontSize: 64,
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
