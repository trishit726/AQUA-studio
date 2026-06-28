// Transitions — scenes strung together with @remotion/transitions, on the
// shared painterly backdrops, unified with grain. Shows slide / wipe / fade.
// This is also the blueprint for ASSEMBLING a full continuous video.
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { z } from "zod";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { Backdrop, PaintedImage, GrainOverlay } from "../lib/textures";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const transitionsSchema = z.object({});
export type TransitionsProps = z.infer<typeof transitionsSchema>;

const SCENE = 54;
const TRANS = 18;
export const TRANSITIONS_DURATION = 4 * SCENE - 3 * TRANS; // 162

const Block: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <span
      style={{
        fontFamily: ANTON,
        fontSize: 150,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: dark ? "#fff" : "#111",
        background: "#f74026",
        padding: "10px 36px 22px",
      }}
    >
      {children}
    </span>
  </AbsoluteFill>
);

export const Transitions: React.FC<TransitionsProps> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <AbsoluteFill>
            <PaintedImage src={staticFile("images/scene.jpg")} />
            <Block>TOKYO</Block>
          </AbsoluteFill>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <AbsoluteFill>
            <Backdrop variant="dusk" />
            <Block dark>DESIGN</Block>
          </AbsoluteFill>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: TRANS })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <AbsoluteFill>
            <Backdrop variant="studio" />
            <Block>IN MOTION</Block>
          </AbsoluteFill>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <AbsoluteFill>
            <Backdrop variant="painterly" />
            <Block>SCRIPT</Block>
          </AbsoluteFill>
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* one grain pass over the whole reel keeps it one cohesive world */}
      <GrainOverlay name="reel" intensity={0.1} vignette={false} />
    </AbsoluteFill>
  );
};
