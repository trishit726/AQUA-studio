// BlockTitle — a flat-block editorial title card: vivid label blocks, heavy
// condensed BLACK caps, stacked & offset like cut-out stickers, over a soft
// grainy painterly background. Blocks wipe in like marker slaps; two dots (the
// "eyes" motif) pop first. (Exported as DesignerInJapan for backwards-compat.)
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { loadFont } from "@remotion/google-fonts/Anton";
import { Backdrop, GrainOverlay } from "../lib/textures";

const { fontFamily } = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export const designerInJapanSchema = z.object({
  lines: z.array(z.string()),
  byline: z.string(),
  blockColor: zColor(),
  textColor: zColor(),
});

export type DesignerInJapanProps = z.infer<typeof designerInJapanSchema>;

export const designerInJapanDefaults: DesignerInJapanProps = {
  lines: ["MAKE", "IT MOVE"],
  byline: "BRANDED MOTION",
  blockColor: "#ea431d", // vermilion
  textColor: "#111111",
};

// Deterministic per-line collage offsets (no Math.random — renders must be stable).
const ROT = [-1.6, 1.2, -0.8, 1.0, -1.2];
const XOFF = [-22, 16, -10, 12, -6];

export const DesignerInJapan: React.FC<DesignerInJapanProps> = ({
  lines,
  byline,
  blockColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const stagger = 7;
  const startAt = 14; // let the dots land first
  const linesDoneAt = startAt + lines.length * stagger + 12;

  // Two-dot "eyes" pop in first.
  const dots = spring({ frame, fps, config: { damping: 11, mass: 0.5 } });

  // Byline slides up after the blocks.
  const bylineIn = interpolate(frame, [linesDoneAt, linesDoneAt + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Whole-scene exit: fade + gentle drift.
  const exit = interpolate(frame, [durationInFrames - 22, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitDrift = interpolate(exit, [0, 1], [-20, 0]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Shared painterly backdrop. Swap variant, or replace with <Img>/<Video>. */}
      <Backdrop variant="painterly" />

      {/* The type stack */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontFamily,
          opacity: exit,
          transform: `translateY(${exitDrift}px)`,
        }}
      >
        {/* Two-dot "eyes" motif */}
        <div style={{ display: "flex", gap: 28, marginBottom: 30 }}>
          {[0, 1].map((d) => (
            <div
              key={d}
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                backgroundColor: blockColor,
                opacity: interpolate(dots, [0, 1], [0, 1]),
                transform: `scale(${interpolate(dots, [0, 1], [0.2, 1])})`,
              }}
            />
          ))}
        </div>

        {/* Stacked orange label blocks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {lines.map((line, i) => {
            const reveal = spring({
              frame: frame - (startAt + i * stagger),
              fps,
              config: { damping: 200 },
            });
            // Marker-slap wipe: reveal the block left-to-right.
            const clip = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
            const x = XOFF[i % XOFF.length] + interpolate(reveal, [0, 1], [-14, 0]);
            const rot = ROT[i % ROT.length];
            return (
              <div
                key={`${line}-${i}`}
                style={{
                  alignSelf: "center",
                  transform: `translateX(${x}px) rotate(${rot}deg)`,
                  clipPath: clip,
                  WebkitClipPath: clip,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: blockColor,
                    color: textColor,
                    fontSize: 150,
                    lineHeight: 0.98,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    padding: "6px 26px 14px",
                  }}
                >
                  {line}
                </span>
              </div>
            );
          })}
        </div>

        {/* Byline on its own little block */}
        <div style={{ marginTop: 34, opacity: bylineIn, transform: `translateY(${interpolate(bylineIn, [0, 1], [10, 0])}px)` }}>
          <span
            style={{
              backgroundColor: blockColor,
              color: textColor,
              fontFamily,
              fontSize: 28,
              letterSpacing: 2,
              textTransform: "uppercase",
              padding: "6px 16px 9px",
            }}
          >
            {byline}
          </span>
        </div>
      </AbsoluteFill>

      {/* Grain over EVERYTHING (incl. the type) — unifies the layers. */}
      <GrainOverlay name="dij" intensity={0.13} />
    </AbsoluteFill>
  );
};
