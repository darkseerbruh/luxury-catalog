import { Composition, staticFile } from "remotion";
import {
  CaptionedVideo,
  calculateCaptionedVideoMetadata,
  captionedVideoSchema,
} from "./CaptionedVideo";
import { BRAND } from "./brand";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CaptionedVideo"
      component={CaptionedVideo}
      calculateMetadata={calculateCaptionedVideoMetadata}
      schema={captionedVideoSchema}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={{
        src: "sample.mp4",
        zoom: BRAND.zoomIntensity,
        overlays: [],
        callouts: [],
      }}
    />
  );
};
