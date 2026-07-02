import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY } from "../load-font";

// A numbered list down one side that builds as each item is revealed. Numbers are
// always visible (dim), each name fades in at its moment and STAYS for the rest.
export const RankList: React.FC<{
  readonly rows: { num: string; name: string; revealSec: number }[];
  readonly leftPct?: number;
  readonly topPct?: number;
  readonly buildFromBottom?: boolean;
}> = ({ rows, leftPct = 5, topPct = 30, buildFromBottom = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // buildFromBottom: show rows so the first-revealed sits at the bottom and the
  // list fills upward toward number one at the top.
  const ordered = buildFromBottom ? [...rows].reverse() : rows;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: `${leftPct}%`,
          top: `${topPct}%`,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {ordered.map((r, i) => {
          const p = spring({
            frame: frame - Math.round(r.revealSec * fps),
            fps,
            config: { damping: 16 },
            durationInFrames: 12,
          });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  fontFamily: CAPTION_FONT_FAMILY,
                  fontWeight: 700,
                  fontSize: 62,
                  color: BRAND.activeWordColor,
                  opacity: 0.4 + 0.6 * p,
                  textShadow: BRAND.captionShadow,
                  minWidth: "1.1ch",
                  textAlign: "center",
                }}
              >
                {r.num}
              </div>
              <div
                style={{
                  fontFamily: CAPTION_FONT_FAMILY,
                  fontWeight: 600,
                  fontSize: 34,
                  color: BRAND.captionColor,
                  background: `rgba(14,13,12,${0.72 * p})`,
                  border: `1px solid rgba(201,162,76,${0.5 * p})`,
                  borderRadius: 12,
                  padding: "8px 14px",
                  whiteSpace: "nowrap",
                  opacity: p,
                  transform: `translateX(${(1 - p) * -24}px)`,
                }}
              >
                {r.name}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
