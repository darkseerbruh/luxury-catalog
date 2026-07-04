import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../brand";
import { CAPTION_FONT_FAMILY } from "../load-font";

type TrackPoint = { t: number; xPct: number; yPct: number };

// Linear-interpolate the hand position at time t (seconds), clamped to the ends.
const sampleTrack = (track: TrackPoint[], t: number): { xPct: number; yPct: number } => {
  if (t <= track[0].t) return track[0];
  const last = track[track.length - 1];
  if (t >= last.t) return last;
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t || 1);
      return { xPct: a.xPct + (b.xPct - a.xPct) * f, yPct: a.yPct + (b.yPct - a.yPct) * f };
    }
  }
  return last;
};

// A product image (with an optional name label under it) that pops into frame,
// holds for the whole sequence, then fades. Follows a hand `track` if given.
export const Overlay: React.FC<{
  readonly img: string;
  readonly durationInFrames: number;
  readonly label?: string;
  readonly fromSec?: number;
  readonly track?: TrackPoint[];
  readonly xPct?: number;
  readonly yPct?: number;
  readonly widthPct?: number;
  readonly tilt?: number;
  readonly cutout?: boolean;
  readonly card?: boolean;
}> = ({
  img,
  durationInFrames,
  label,
  fromSec = 0,
  track,
  xPct = 80,
  yPct = 24,
  widthPct = 24,
  tilt = -4,
  cutout = false,
  card = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.6 }, durationInFrames: 12 });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(enter, [0, 1], [0.7, 1]);
  const rise = interpolate(enter, [0, 1], [26, 0]);
  const opacity = Math.min(enter, exit);

  const pos =
    track && track.length > 0 ? sampleTrack(track, fromSec + frame / fps) : { xPct, yPct };

  // Card (cutout:false): the product image sits on a dark, gold-edged panel so it
  // reads as an overlay and pops against ANY background (e.g. her real bag wall).
  // Cutout (true): the bag floats as a shape with a drop shadow.
  const cardStyle: React.CSSProperties = card
    ? {
        background: "rgba(20,19,18,0.94)",
        border: "2px solid #c9a24c",
        borderRadius: 20,
        padding: 14,
        boxShadow: "0 24px 55px rgba(0,0,0,0.6)",
      }
    : {};
  const imgStyle: React.CSSProperties = card
    ? { display: "block", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.4))" }
    : cutout
      ? { filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.55))" }
      : { borderRadius: 12, display: "block", boxShadow: "0 24px 50px rgba(0,0,0,0.5)" };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: `${pos.xPct}%`,
          top: `${pos.yPct}%`,
          width: `${widthPct}%`,
          transform: `translate(-50%, calc(-50% + ${rise}px)) scale(${scale}) rotate(${tilt}deg)`,
          opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          ...cardStyle,
        }}
      >
        <Img src={staticFile(img)} style={{ width: "100%", ...imgStyle }} />
        {label ? (
          <div
            style={{
              fontFamily: CAPTION_FONT_FAMILY,
              fontWeight: 600,
              fontSize: 30,
              lineHeight: 1.1,
              textAlign: "center",
              color: BRAND.captionColor,
              background: "rgba(14,13,12,0.72)",
              border: `1px solid rgba(201,162,76,0.55)`,
              borderRadius: 12,
              padding: "8px 14px",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
