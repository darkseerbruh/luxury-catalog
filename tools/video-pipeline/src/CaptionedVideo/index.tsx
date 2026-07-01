import { Caption, createTikTokStyleCaptions } from "@remotion/captions";
import { getVideoMetadata } from "@remotion/media-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  cancelRender,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
  watchStaticFile,
} from "remotion";
import { z } from "zod";
import { BRAND } from "../brand";
import { NoCaptionFile } from "./NoCaptionFile";
import SubtitlePage from "./SubtitlePage";

const overlaySchema = z.object({
  img: z.string(), // filename in public/
  fromSec: z.number(),
  toSec: z.number(),
  xPct: z.number().optional(), // center x, 0-100 (default 50)
  yPct: z.number().optional(), // center y, 0-100 (default 32)
  widthPct: z.number().optional(), // width as % of canvas (default 46)
});

export const captionedVideoSchema = z.object({
  src: z.string(), // basename of a video file in public/
  zoom: z.number().default(BRAND.zoomIntensity),
  overlays: z.array(overlaySchema).default([]),
});

type Props = z.infer<typeof captionedVideoSchema>;

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<
  Props
> = async ({ props }) => {
  const fps = 30;
  const metadata = await getVideoMetadata(staticFile(props.src));
  return {
    fps,
    durationInFrames: Math.floor(metadata.durationInSeconds * fps),
  };
};

// How long a group of words stays on screen. 1200ms reads calmly; drop toward
// 400 for one or two words at a time.
const SWITCH_CAPTIONS_EVERY_MS = 1200;

export const CaptionedVideo: React.FC<Props> = ({ src, zoom, overlays }) => {
  const [subtitles, setSubtitles] = useState<Caption[]>([]);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender());
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const subtitlesFile = staticFile(src)
    .replace(/\.mp4$/, ".json")
    .replace(/\.mkv$/, ".json")
    .replace(/\.mov$/, ".json")
    .replace(/\.webm$/, ".json");

  const fetchSubtitles = useCallback(async () => {
    try {
      const res = await fetch(subtitlesFile);
      if (!res.ok) {
        setSubtitles([]);
        continueRender(handle);
        return;
      }
      const data = (await res.json()) as Caption[];
      setSubtitles(data);
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [continueRender, handle, subtitlesFile]);

  useEffect(() => {
    fetchSubtitles();
    const c = watchStaticFile(subtitlesFile, () => fetchSubtitles());
    return () => c.cancel();
  }, [fetchSubtitles, src, subtitlesFile]);

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      captions: subtitles ?? [],
    });
  }, [subtitles]);

  // Slow Ken Burns push-in for texture, kept gentle for a luxury feel.
  const videoScale = interpolate(
    frame,
    [0, Math.max(durationInFrames, 1)],
    [1, 1 + zoom],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0e0d0c" }}>
      <AbsoluteFill style={{ transform: `scale(${videoScale})` }}>
        <OffthreadVideo style={{ objectFit: "cover" }} src={staticFile(src)} />
      </AbsoluteFill>

      {overlays.map((o, i) => (
        <Sequence
          key={`ov-${i}`}
          from={Math.round(o.fromSec * fps)}
          durationInFrames={Math.max(1, Math.round((o.toSec - o.fromSec) * fps))}
        >
          <AbsoluteFill
            style={{
              justifyContent: "flex-start",
              alignItems: "flex-start",
            }}
          >
            <Img
              src={staticFile(o.img)}
              style={{
                position: "absolute",
                width: `${o.widthPct ?? 46}%`,
                left: `${o.xPct ?? 50}%`,
                top: `${o.yPct ?? 32}%`,
                transform: "translate(-50%, -50%)",
                borderRadius: 18,
                boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}

      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const subtitleStartFrame = (page.startMs / 1000) * fps;
        const subtitleEndFrame = Math.min(
          nextPage ? (nextPage.startMs / 1000) * fps : Infinity,
          subtitleStartFrame + SWITCH_CAPTIONS_EVERY_MS,
        );
        const dur = subtitleEndFrame - subtitleStartFrame;
        if (dur <= 0) {
          return null;
        }
        return (
          <Sequence
            key={index}
            from={subtitleStartFrame}
            durationInFrames={dur}
          >
            <SubtitlePage page={page} />
          </Sequence>
        );
      })}

      {subtitles.length === 0 ? <NoCaptionFile /> : null}
    </AbsoluteFill>
  );
};
