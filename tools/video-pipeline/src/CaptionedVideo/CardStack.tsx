import React from "react";
import { AbsoluteFill } from "remotion";
import { BRAND } from "../brand";
import { CAPTION_SERIF_FAMILY } from "../load-font";

// A static stacked text card: the whole thing is on screen from frame 0 (no
// pop-in), Playfair serif, cream. Each block sets its own size; `bullet` blocks
// render as a left-aligned gold-diamond list, `italic` for emphasis lines.
// Accessibility: every size is clamped to a floor, and the text sits on a soft
// dark backing so cream text stays legible on bright footage (see brand.ts +
// docs/video-accessibility.md).
export type CardBlock = {
  text: string;
  fontPx: number;
  italic?: boolean;
  bullet?: boolean;
  hint?: boolean; // small muted pointer like "(more in caption)" — exempt from the size floor
};

const sz = (px: number) => Math.max(BRAND.minCardCaptionPx, px);

export const CardStack: React.FC<{
  readonly blocks: CardBlock[];
  readonly bottomPx?: number;
  readonly pos?: "center" | "top"; // "top" keeps the hook clear of a centered subject
}> = ({ blocks, bottomPx = 560, pos = "center" }) => {
  const items: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < blocks.length) {
    if (blocks[i].bullet) {
      const run: CardBlock[] = [];
      while (i < blocks.length && blocks[i].bullet) {
        run.push(blocks[i]);
        i++;
      }
      items.push(
        <div
          key={key++}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 16,
            marginTop: 14,
            maxWidth: 860,
          }}
        >
          {run.map((r, j) => (
            <div
              key={j}
              style={{
                display: "flex",
                gap: 18,
                alignItems: "baseline",
                fontFamily: CAPTION_SERIF_FAMILY,
                fontWeight: 600,
                color: BRAND.captionColor,
                fontSize: sz(r.fontPx),
                lineHeight: 1.22,
                textAlign: "left",
              }}
            >
              <span style={{ color: BRAND.activeWordColor, fontSize: sz(r.fontPx) * 0.6 }}>
                &#9670;
              </span>
              <span>{r.text}</span>
            </div>
          ))}
        </div>,
      );
    } else {
      const b = blocks[i];
      items.push(
        <div
          key={key++}
          style={{
            fontFamily: CAPTION_SERIF_FAMILY,
            fontStyle: b.hint || b.italic ? "italic" : "normal",
            fontWeight: b.hint ? 500 : 700,
            color: BRAND.captionColor,
            opacity: b.hint ? 0.9 : 1,
            // Hints (e.g. "(more in caption)") are a minor pointer, so they are
            // allowed below the content floor, but never below basic legibility.
            fontSize: b.hint ? Math.max(34, b.fontPx) : sz(b.fontPx),
            lineHeight: 1.2,
            marginTop: b.hint ? -6 : 0,
            textAlign: "center",
          }}
        >
          {b.text}
        </div>,
      );
      i++;
    }
  }

  return (
    <AbsoluteFill
      style={{
        top: 0,
        bottom: pos === "top" ? 0 : bottomPx,
        justifyContent: pos === "top" ? "flex-start" : "center",
        alignItems: "center",
        paddingTop: pos === "top" ? 150 : 0,
        paddingLeft: 60,
        paddingRight: 60,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          maxWidth: 940,
          padding: "54px 60px",
          borderRadius: 44,
          background: BRAND.cardTextBacking,
          textShadow: BRAND.cardTextShadow,
        }}
      >
        {items}
      </div>
    </AbsoluteFill>
  );
};
