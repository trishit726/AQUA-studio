// KineticText — words spring in one-by-one, then the whole line fades out.
// Demonstrates spring() for staggered, snappy motion.
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
import { EASE_IN_OUT } from "../lib/animation";
import { FONT_FAMILY } from "../lib/fonts";
import { COLORS, TITLE_SAFE_PADDING } from "../config";

export const kineticTextSchema = z.object({
  text: z.string(),
  backgroundColor: zColor(),
  textColor: zColor(),
  staggerFrames: z.number().min(1).max(20),
});

export type KineticTextProps = z.infer<typeof kineticTextSchema>;

export const kineticTextDefaults: KineticTextProps = {
  text: "Words that move with intent",
  backgroundColor: COLORS.bg,
  textColor: COLORS.text,
  staggerFrames: 4,
};

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  backgroundColor,
  textColor,
  staggerFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = text.split(" ");

  // Whole-line exit so nothing is left frozen on screen.
  const exit = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: FONT_FAMILY,
        justifyContent: "center",
        alignItems: "center",
        padding: TITLE_SAFE_PADDING,
        opacity: exit,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 24px",
          maxWidth: "80%",
        }}
      >
        {words.map((word, i) => {
          const enter = spring({
            frame: frame - i * staggerFrames,
            fps,
            config: { damping: 200 },
          });
          const y = interpolate(enter, [0, 1], [40, 0]);
          return (
            <span
              key={`${word}-${i}`}
              style={{
                color: textColor,
                fontSize: 84,
                fontWeight: 700,
                letterSpacing: -1,
                opacity: enter,
                transform: `translateY(${y}px)`,
                display: "inline-block",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
