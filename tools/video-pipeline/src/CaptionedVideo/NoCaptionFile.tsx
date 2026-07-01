import { AbsoluteFill } from "remotion";

// Shown only in the Studio preview when a clip has no captions yet (before the
// transcribe step runs). It never appears in a finished render.
export const NoCaptionFile: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          fontFamily: "sans-serif",
          fontSize: 26,
          color: "#f3ede0",
          background: "rgba(0,0,0,0.55)",
          padding: "10px 18px",
          borderRadius: 10,
        }}
      >
        No captions yet. Run: npm run make
      </div>
    </AbsoluteFill>
  );
};
