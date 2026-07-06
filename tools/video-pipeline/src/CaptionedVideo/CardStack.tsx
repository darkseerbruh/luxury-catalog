import React from "react";
import { AbsoluteFill } from "remotion";
import { BRAND } from "../brand";
import { CAPTION_SERIF_FAMILY } from "../load-font";

// A static stacked text card: the whole thing is on screen from frame 0 (no
// pop-in), Playfair serif, cream. Each block sets its own size; `bullet` blocks
// render as a left-aligned gold-diamond list, `italic` for emphasis lines.
export type CardBlock = {
  text: string;
  fontPx: number;
  italic?: boolean;
  bullet?: boolean;
};

export const CardStack: React.FC<{
  readonly blocks: CardBlock[];
  readonly bottomPx?: number;
}> = ({ blocks, bottomPx = 560 }) => {
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
                fontSize: r.fontPx,
                lineHeight: 1.22,
                textAlign: "left",
              }}
            >
              <span style={{ color: BRAND.activeWordColor, fontSize: r.fontPx * 0.6 }}>
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
            fontStyle: b.italic ? "italic" : "normal",
            fontWeight: 700,
            color: BRAND.captionColor,
            fontSize: b.fontPx,
            lineHeight: 1.2,
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
        bottom: bottomPx,
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 70,
        paddingRight: 70,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          maxWidth: 940,
          textShadow: BRAND.captionShadow,
        }}
      >
        {items}
      </div>
    </AbsoluteFill>
  );
};
