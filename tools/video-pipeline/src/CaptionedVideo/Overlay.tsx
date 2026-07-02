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

// A product image that pops into frame (spring scale + rise), holds, then fades.
// If a hand `track` is given it follows the hand; otherwise it sits at xPct/yPct.
export const Overlay: React.FC<{
  readonly img: string;
  readonly durationInFrames: number;
  readonly fromSec?: number;
  readonly track?: TrackPoint[];
  readonly xPct?: number;
  readonly yPct?: number;
  readonly widthPct?: number;
  readonly tilt?: number;
  readonly cutout?: boolean;
}> = ({
  img,
  durationInFrames,
  fromSec = 0,
  track,
  xPct = 64,
  yPct = 52,
  widthPct = 40,
  tilt = -4,
  cutout = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
    durationInFrames: 12,
  });
  const exit = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const scale = interpolate(enter, [0, 1], [0.7, 1]);
  const rise = interpolate(enter, [0, 1], [26, 0]);
  const opacity = Math.min(enter, exit);

  const pos =
    track && track.length > 0
      ? sampleTrack(track, fromSec + frame / fps)
      : { xPct, yPct };

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(img)}
        style={{
          position: "absolute",
          left: `${pos.xPct}%`,
          top: `${pos.yPct}%`,
          width: `${widthPct}%`,
          transform: `translate(-50%, calc(-50% + ${rise}px)) scale(${scale}) rotate(${tilt}deg)`,
          opacity,
          // Cutout: shadow follows the bag's shape. Card: rounded photo with a border.
          ...(cutout
            ? { filter: "drop-shadow(0 22px 34px rgba(0,0,0,0.5))" }
            : {
                borderRadius: 20,
                boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }),
        }}
      />
    </AbsoluteFill>
  );
};
