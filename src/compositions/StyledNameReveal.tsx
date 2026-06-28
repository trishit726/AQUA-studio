// StyledNameReveal — the same letter-by-letter reveal, but its entire look
// (color, font, motion feel, spacing, atmosphere) comes from a STYLE PRESET.
// Change the `style` dropdown in Studio to instantly wear a different art style.
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { z } from "zod";
import { STYLES } from "../styles";

export const styledNameRevealSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  style: z.enum(["japanese", "anthropic"]),
});

export type StyledNameRevealProps = z.infer<typeof styledNameRevealSchema>;

export const StyledNameReveal: React.FC<StyledNameRevealProps> = ({
  name,
  tagline,
  style,
}) => {
  const s = STYLES[style];
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const letters = name.split("");

  const lettersDoneAt = letters.length * s.staggerFrames + 20;

  // Hairline draws out from the centre once the letters have settled.
  const lineProgress = spring({
    frame: frame - lettersDoneAt,
    fps,
    config: { damping: 200 },
  });

  // Tagline fades up shortly after.
  const taglineIn = interpolate(
    frame,
    [lettersDoneAt + 8, lettersDoneAt + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: s.entranceEase },
  );

  // Hanko-style seal mark (Japanese preset only) — a small pressed square.
  const sealIn = s.seal
    ? spring({ frame: frame - (lettersDoneAt + 12), fps, config: { damping: 13, mass: 0.5 } })
    : 0;

  // Whole-scene exit.
  const exit = interpolate(frame, [durationInFrames - 26, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: s.exitEase,
  });
  const exitDrift = interpolate(exit, [0, 1], [-22, 0]);

  // Soft breathing glow (only if the style asks for it).
  const breathe = 0.5 + 0.5 * Math.sin((frame / fps) * 1.0);
  const glowOpacity =
    s.glow > 0 ? interpolate(breathe, [0, 1], [s.glow * 0.55, s.glow]) * exit : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: s.bg,
        fontFamily: s.fontFamily,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {glowOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            width: 1500,
            height: 1500,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${s.accent} 0%, transparent 60%)`,
            opacity: glowOpacity,
            filter: "blur(60px)",
          }}
        />
      )}

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
              frame: frame - i * s.staggerFrames,
              fps,
              config: { damping: s.springDamping, mass: 1.1 },
            });
            const blur = interpolate(enter, [0, 1], [s.blurAmount, 0]);
            const y = interpolate(enter, [0, 1], [s.riseY, 0]);
            return (
              <span
                key={`${char}-${i}`}
                style={{
                  color: s.text,
                  fontSize: s.fontSize,
                  fontWeight: s.fontWeight,
                  lineHeight: 1,
                  letterSpacing: s.letterSpacing,
                  opacity: enter,
                  filter: `blur(${blur}px)`,
                  transform: `translateY(${y}px)`,
                  display: "inline-block",
                  whiteSpace: "pre",
                }}
              >
                {char === " " ? " " : char}
              </span>
            );
          })}
        </div>

        {/* Hairline */}
        <div
          style={{
            height: 1,
            width: s.lineWidth,
            margin: "28px auto 0",
            backgroundColor: s.accent,
            transform: `scaleX(${lineProgress})`,
            transformOrigin: "center",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            marginTop: 22,
            color: s.muted,
            fontSize: s.taglineSize,
            fontWeight: 400,
            fontStyle: s.taglineItalic ? "italic" : "normal",
            letterSpacing: s.taglineSpacing,
            opacity: taglineIn,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [10, 0])}px)`,
          }}
        >
          {tagline}
        </div>

        {/* Hanko seal (Japanese) */}
        {s.seal && (
          <div
            style={{
              width: 46,
              height: 46,
              margin: "34px auto 0",
              borderRadius: 6,
              backgroundColor: s.accent,
              opacity: interpolate(sealIn, [0, 1], [0, 0.92]) * exit,
              transform: `scale(${interpolate(sealIn, [0, 1], [0.6, 1])})`,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
