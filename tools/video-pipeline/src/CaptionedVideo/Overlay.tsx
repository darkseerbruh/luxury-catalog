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

// A product image that pops into frame (spring scale + rise), holds, then fades.
// Position and size are chosen by the caller so it can land where the speaker
// gestures. Rendered inside a <Sequence> that controls when it is on screen.
export const Overlay: React.FC<{
  readonly img: string;
  readonly durationInFrames: number;
  readonly xPct?: number;
  readonly yPct?: number;
  readonly widthPct?: number;
  readonly tilt?: number;
}> = ({ img, durationInFrames, xPct = 64, yPct = 52, widthPct = 40, tilt = -4 }) => {
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

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(img)}
        style={{
          position: "absolute",
          left: `${xPct}%`,
          top: `${yPct}%`,
          width: `${widthPct}%`,
          transform: `translate(-50%, calc(-50% + ${rise}px)) scale(${scale}) rotate(${tilt}deg)`,
          opacity,
          borderRadius: 20,
          boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
    </AbsoluteFill>
  );
};
