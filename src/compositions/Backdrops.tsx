// Backdrops — a 3×2 showcase of the reusable background variants, each with the
// grain/grade overlay on top and a halfof8-style label block. Use it to pick
// which backdrop(s) to use in your real compositions.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { z } from "zod";
import { Backdrop, GrainOverlay, BACKDROPS, BackdropVariant } from "../lib/textures";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const backdropsSchema = z.object({});
export type BackdropsProps = z.infer<typeof backdropsSchema>;

const VARIANTS = Object.keys(BACKDROPS) as BackdropVariant[];
const COLS = 3;
const ROWS = 2;
const GAP = 36;

const Tile: React.FC<{ variant: BackdropVariant; index: number }> = ({ variant, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame: frame - index * 6, fps, config: { damping: 14, mass: 0.7 } });
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 14,
        opacity: interpolate(appear, [0, 1], [0, 1]),
        transform: `scale(${interpolate(appear, [0, 1], [0.95, 1])})`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
      }}
    >
      <Backdrop variant={variant} />
      <GrainOverlay name={variant} dark={BACKDROPS[variant].dark} />
      {/* label block (halfof8 style) */}
      <div style={{ position: "absolute", left: 22, bottom: 22 }}>
        <span
          style={{
            fontFamily: ANTON,
            fontSize: 30,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#111",
            background: "#f74026",
            padding: "4px 16px 8px",
          }}
        >
          {variant}
        </span>
      </div>
    </div>
  );
};

export const Backdrops: React.FC<BackdropsProps> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1c1a17", padding: 60 }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: GAP,
        }}
      >
        {VARIANTS.map((v, i) => (
          <Tile key={v} variant={v} index={i} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
