import { TikTokPage } from "@remotion/captions";
import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Page } from "./Page";

const SubtitlePage: React.FC<{
  readonly page: TikTokPage;
  readonly captionFontPx?: number;
}> = ({ page, captionFontPx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 6,
  });

  return (
    <AbsoluteFill>
      <Page enterProgress={enter} page={page} captionFontPx={captionFontPx} />
    </AbsoluteFill>
  );
};

export default SubtitlePage;
