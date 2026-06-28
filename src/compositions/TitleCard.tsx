// TitleCard — a centered title + subtitle on a solid background.
// Enters with a soft fade + rise, exits with a fade. Edit freely.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { enterExit } from "../lib/animation";
import { FONT_FAMILY } from "../lib/fonts";
import { COLORS, TITLE_SAFE_PADDING } from "../config";

export const titleCardSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundColor: zColor(),
  textColor: zColor(),
  accentColor: zColor(),
});

export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const titleCardDefaults: TitleCardProps = {
  title: "Your Title Here",
  subtitle: "A neutral starting point you can restyle",
  backgroundColor: COLORS.bg,
  textColor: COLORS.text,
  accentColor: COLORS.accent,
};

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  backgroundColor,
  textColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const env = enterExit({ frame, durationInFrames });
  const rise = interpolate(env, [0, 1], [24, 0]); // px the block rises into place

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: FONT_FAMILY,
        justifyContent: "center",
        alignItems: "center",
        padding: TITLE_SAFE_PADDING,
      }}
    >
      <div style={{ opacity: env, transform: `translateY(${rise}px)`, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 4,
            backgroundColor: accentColor,
            margin: "0 auto 28px",
            borderRadius: 2,
          }}
        />
        <h1 style={{ color: textColor, fontSize: 92, fontWeight: 700, margin: 0, letterSpacing: -1 }}>
          {title}
        </h1>
        <p style={{ color: COLORS.muted, fontSize: 34, fontWeight: 400, marginTop: 20 }}>
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
