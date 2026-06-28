// TransparentOverlay — a badge that renders over a TRANSPARENT background,
// so it can be exported with a real alpha channel and dropped onto footage
// in any editor. Note: NO background color is set on the AbsoluteFill.
//
// Render it transparent with the ProRes 4444 command in the README.
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
import { enterExit } from "../lib/animation";
import { FONT_FAMILY } from "../lib/fonts";
import { COLORS } from "../config";

export const transparentOverlaySchema = z.object({
  label: z.string(),
  badgeColor: zColor(),
  textColor: zColor(),
});

export type TransparentOverlayProps = z.infer<typeof transparentOverlaySchema>;

export const transparentOverlayDefaults: TransparentOverlayProps = {
  label: "LIVE",
  badgeColor: COLORS.accent,
  textColor: "#ffffff",
};

export const TransparentOverlay: React.FC<TransparentOverlayProps> = ({
  label,
  badgeColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const env = enterExit({ frame, durationInFrames, enter: 14, exit: 14 });
  const pop = spring({ frame, fps, config: { damping: 12, mass: 0.6 } });
  const scale = interpolate(pop, [0, 1], [0.85, 1]) * env + (1 - env) * 0.85;

  return (
    // No backgroundColor here on purpose — the canvas stays transparent.
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: env,
          transform: `scale(${scale})`,
          backgroundColor: badgeColor,
          color: textColor,
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: 2,
          padding: "24px 56px",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          gap: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            backgroundColor: textColor,
            opacity: interpolate(
              frame % fps,
              [0, fps / 2, fps],
              [1, 0.3, 1],
              { extrapolateRight: "clamp" },
            ),
          }}
        />
        {label}
      </div>
    </AbsoluteFill>
  );
};
