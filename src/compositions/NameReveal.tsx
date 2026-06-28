// NameReveal — a poetic, letter-by-letter name reveal.
// Each letter focuses in from a soft blur and rises into place; a hairline
// draws beneath the name; a tagline fades in; then the whole thing drifts
// and dissolves. Elegant serif (Cormorant Garamond), restrained palette.
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { loadFont } from "@remotion/google-fonts/CormorantGaramond";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const nameRevealSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  backgroundColor: zColor(),
  textColor: zColor(),
  accentColor: zColor(),
  staggerFrames: z.number().min(1).max(20),
});

export type NameRevealProps = z.infer<typeof nameRevealSchema>;

export const nameRevealDefaults: NameRevealProps = {
  name: "Fable",
  tagline: "once upon a time",
  backgroundColor: "#0b0d12",
  textColor: "#f3efe6",
  accentColor: "#c9a86a", // warm, antique gold
  staggerFrames: 5,
};

export const NameReveal: React.FC<NameRevealProps> = ({
  name,
  tagline,
  backgroundColor,
  textColor,
  accentColor,
  staggerFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const letters = name.split("");

  // When the letters have mostly arrived, start the underline + tagline.
  const lettersDoneAt = letters.length * staggerFrames + 20;

  // Hairline under the name draws out from the centre.
  const lineProgress = spring({
    frame: frame - lettersDoneAt,
    fps,
    config: { damping: 200 },
  });

  // Tagline fades up shortly after the line begins.
  const taglineIn = interpolate(
    frame,
    [lettersDoneAt + 8, lettersDoneAt + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );

  // Whole-scene exit: fade + a slow drift up + a touch of bloom.
  const exit = interpolate(
    frame,
    [durationInFrames - 24, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );
  const exitDrift = interpolate(exit, [0, 1], [-28, 0]);

  // A slow, breathing glow behind the name so it never feels static.
  const breathe = 0.5 + 0.5 * Math.sin((frame / fps) * 1.1);
  const glowOpacity = interpolate(breathe, [0, 1], [0.18, 0.34]) * exit;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Soft radial glow */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 60%)`,
          opacity: glowOpacity,
          filter: "blur(40px)",
        }}
      />

      {/* Vignette for depth */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div
        style={{
          opacity: exit,
          transform: `translateY(${exitDrift}px)`,
          textAlign: "center",
        }}
      >
        {/* The name, letter by letter */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {letters.map((char, i) => {
            const enter = spring({
              frame: frame - i * staggerFrames,
              fps,
              config: { damping: 200, mass: 1.1 },
            });
            const blur = interpolate(enter, [0, 1], [16, 0]);
            const y = interpolate(enter, [0, 1], [34, 0]);
            return (
              <span
                key={`${char}-${i}`}
                style={{
                  color: textColor,
                  fontSize: 200,
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: 4,
                  opacity: enter,
                  filter: `blur(${blur}px)`,
                  transform: `translateY(${y}px)`,
                  display: "inline-block",
                  // keep spaces visible
                  whiteSpace: "pre",
                }}
              >
                {char === " " ? " " : char}
              </span>
            );
          })}
        </div>

        {/* Hairline */}
        <div
          style={{
            height: 1,
            width: 260,
            margin: "26px auto 0",
            backgroundColor: accentColor,
            transform: `scaleX(${lineProgress})`,
            transformOrigin: "center",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            marginTop: 22,
            color: accentColor,
            fontSize: 36,
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: 6,
            opacity: taglineIn,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [10, 0])}px)`,
          }}
        >
          {tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};
