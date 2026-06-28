// LowerThird — a name/role bar in the lower-left, over a transparent area.
// Slides in from the left, holds, slides out. Sits in the lower third so it
// can be composited over footage.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { enterExit } from "../lib/animation";
import { FONT_FAMILY } from "../lib/fonts";
import { COLORS } from "../config";

export const lowerThirdSchema = z.object({
  name: z.string(),
  role: z.string(),
  barColor: zColor(),
  textColor: zColor(),
  accentColor: zColor(),
});

export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

export const lowerThirdDefaults: LowerThirdProps = {
  name: "Jane Doe",
  role: "Motion Designer",
  barColor: COLORS.surface,
  textColor: COLORS.text,
  accentColor: COLORS.accent,
};

export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  role,
  barColor,
  textColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const env = enterExit({ frame, durationInFrames, enter: 16, exit: 14 });
  const slide = interpolate(env, [0, 1], [-60, 0]); // px slide from the left

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      <div
        style={{
          position: "absolute",
          left: "6%",
          bottom: "12%",
          opacity: env,
          transform: `translateX(${slide}px)`,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <div style={{ width: 6, backgroundColor: accentColor, borderRadius: 3 }} />
        <div
          style={{
            backgroundColor: barColor,
            padding: "20px 32px",
            marginLeft: 14,
            borderRadius: 8,
          }}
        >
          <div style={{ color: textColor, fontSize: 44, fontWeight: 700, lineHeight: 1.1 }}>
            {name}
          </div>
          <div style={{ color: COLORS.muted, fontSize: 26, fontWeight: 400, marginTop: 6 }}>
            {role}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
