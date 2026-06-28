// PaintedDemo — shows the PaintedImage shade-merging effect on a real photo,
// with the original photo inset (top-right) for before/after comparison.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { z } from "zod";
import { PaintedImage, GrainOverlay } from "../lib/textures";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const paintedDemoSchema = z.object({
  src: z.string(),
  strength: z.number().min(0).max(120),
});
export type PaintedDemoProps = z.infer<typeof paintedDemoSchema>;
export const paintedDemoDefaults: PaintedDemoProps = {
  src: "images/scene.jpg",
  strength: 75,
};

export const PaintedDemo: React.FC<PaintedDemoProps> = ({ src, strength }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      <PaintedImage src={staticFile(src)} strength={strength} />
      <GrainOverlay name="painted" intensity={0.1} />

      {/* original photo inset for comparison */}
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 40,
          width: 360,
          height: 203,
          borderRadius: 8,
          overflow: "hidden",
          border: "2px solid #fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <span
          style={{
            position: "absolute",
            left: 10,
            bottom: 8,
            fontFamily: ANTON,
            fontSize: 16,
            color: "#111",
            background: "#fff",
            padding: "2px 8px",
          }}
        >
          ORIGINAL
        </span>
      </div>

      <span
        style={{
          position: "absolute",
          left: 40,
          bottom: 40,
          fontFamily: ANTON,
          fontSize: 30,
          color: "#111",
          background: "#f74026",
          padding: "4px 16px 8px",
        }}
      >
        PAINTED · shades merged
      </span>
    </AbsoluteFill>
  );
};
