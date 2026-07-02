import { Caption, createTikTokStyleCaptions } from "@remotion/captions";
import { getVideoMetadata } from "@remotion/media-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  cancelRender,
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
import { Overlay } from "./Overlay";
import { RankTracker } from "./RankTracker";
import SubtitlePage from "./SubtitlePage";

const overlaySchema = z.object({
  img: z.string(), // filename in public/
  fromSec: z.number(),
  toSec: z.number(),
  xPct: z.number().optional(), // center x, 0-100 (default 64)
  yPct: z.number().optional(), // center y, 0-100 (default 52)
  widthPct: z.number().optional(), // width as % of canvas (default 40)
  tilt: z.number().optional(), // rotation in degrees (default -4)
  cutout: z.boolean().optional(), // style as a shape (drop shadow) vs a photo card
  track: z
    .array(z.object({ t: z.number(), xPct: z.number(), yPct: z.number() }))
    .optional(), // hand path to follow
});

const rankTrackerSchema = z.object({
  labels: z.array(z.string()),
  fillTimes: z.array(z.number()), // seconds, one per label
  yPct: z.number().optional(),
});

export const captionedVideoSchema = z.object({
  src: z.string(), // basename of a video file in public/
  zoom: z.number().default(BRAND.zoomIntensity),
  overlays: z.array(overlaySchema).default([]),
  rankTracker: rankTrackerSchema.optional(),
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

export const CaptionedVideo: React.FC<Props> = ({
  src,
  zoom,
  overlays,
  rankTracker,
}) => {
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

      {overlays.map((o, i) => {
        const from = Math.round(o.fromSec * fps);
        const dur = Math.max(1, Math.round((o.toSec - o.fromSec) * fps));
        return (
          <Sequence key={`ov-${i}`} from={from} durationInFrames={dur}>
            <Overlay
              img={o.img}
              durationInFrames={dur}
              fromSec={o.fromSec}
              track={o.track}
              cutout={o.cutout}
              xPct={o.xPct}
              yPct={o.yPct}
              widthPct={o.widthPct}
              tilt={o.tilt}
            />
          </Sequence>
        );
      })}

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

      {rankTracker ? (
        <RankTracker
          labels={rankTracker.labels}
          fillTimes={rankTracker.fillTimes}
          yPct={rankTracker.yPct}
        />
      ) : null}

      {subtitles.length === 0 ? <NoCaptionFile /> : null}
    </AbsoluteFill>
  );
};
