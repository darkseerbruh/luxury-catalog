import React from "react";
import { AbsoluteFill } from "remotion";
import { BRAND } from "../brand";
import { CAPTION_SERIF_FAMILY } from "../load-font";

// The editorial footer block from the brand text-card template: a small gold
// diamond, the italic tagline, the FOLLOW ALONG line, and the site in a pill.
// Sits in the lower third but lifted off the very bottom so it clears TikTok's
// caption + right-side action buttons.
export const CardFooter: React.FC<{
  readonly tagline?: string;
  readonly follow?: string;
  readonly url?: string;
  readonly bottomPx?: number;
}> = ({
  tagline = "know the facts on every bag",
  follow = "FOLLOW ALONG",
  url = "luxurycatalog.com",
  bottomPx = 430,
}) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: bottomPx,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textShadow: BRAND.captionShadow,
        }}
      >
        <div style={{ color: BRAND.activeWordColor, fontSize: 18, lineHeight: 1 }}>
          &#9670;
        </div>
        <div
          style={{
            fontFamily: CAPTION_SERIF_FAMILY,
            fontStyle: "italic",
            fontWeight: 500,
            color: BRAND.captionColor,
            fontSize: 36,
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            fontFamily: CAPTION_SERIF_FAMILY,
            fontWeight: 600,
            color: BRAND.captionColor,
            opacity: 0.82,
            fontSize: 29,
            letterSpacing: 11,
            textTransform: "uppercase",
          }}
        >
          {follow}
        </div>
        <div
          style={{
            marginTop: 6,
            border: "1.5px solid rgba(243,237,224,0.5)",
            borderRadius: 999,
            padding: "13px 38px",
            fontFamily: CAPTION_SERIF_FAMILY,
            fontWeight: 600,
            color: BRAND.captionColor,
            fontSize: 31,
          }}
        >
          {url}
        </div>
      </div>
    </AbsoluteFill>
  );
};
