import React from "react";
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY } from "../load-font";

// A follow-the-account card pinned near the bottom. Pops in when she reaches the
// outro (timed to `atSec`, usually the same phrase as the site CTA) and then STAYS
// to the end of the reel, because the ask has to still be on screen at the cut.
// Never spoken; this is the on-screen follow ask (script-requirements.md rule 27).
export const FollowCta: React.FC<{
  readonly text: string;
  readonly atSec: number;
  readonly yPct?: number;
}> = ({ text, atSec, yPct = 90 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - Math.round(atSec * fps);
  if (local < 0) return null;

  const pop = spring({ frame: local, fps, config: { damping: 12, mass: 0.6 }, durationInFrames: 14 });
  const pulse = 1 + 0.015 * Math.sin((local / fps) * 3.2);
  const scale = interpolate(pop, [0, 1], [0.74, 1]) * pulse;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: `${yPct}%`,
          transform: `translateY(-50%) scale(${scale})`,
          opacity: pop,
          maxWidth: "90%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 30px",
          borderRadius: 999,
          background: "rgba(14,13,12,0.92)",
          border: "3px solid #c9a24c",
          boxShadow: "0 16px 44px rgba(0,0,0,0.5)",
        }}
      >
        <span
          style={{
            fontFamily: CAPTION_FONT_FAMILY,
            fontWeight: 800,
            fontSize: 40,
            color: "#0e0d0c",
            background: "#e3c785",
            borderRadius: 999,
            padding: "4px 16px",
            whiteSpace: "nowrap",
          }}
        >
          + Follow
        </span>
        <span
          style={{
            fontFamily: CAPTION_FONT_FAMILY,
            fontWeight: 700,
            fontSize: 44,
            color: "#e3c785",
            textShadow: BRAND.captionShadow,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
