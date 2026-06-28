// Assembly — the full continuous "Designer, In Japan" piece. Stitches the real
// building blocks together with transitions:
//   Title card → painted "behind the scenes" → the scripting app → end card.
// This is the payoff: every part working as one video.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { z } from "zod";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { DesignerInJapan } from "./DesignerInJapan";
import { ScriptingApp } from "./ScriptingApp";
import { PaintedImage, GrainOverlay, PALETTE } from "../lib/textures";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const assemblySchema = z.object({
  name: z.string(),
  site: z.string(),
  music: z.string(), // optional path in public/ for a lo-fi bed, e.g. "sfx/track.mp3"
});
export type AssemblyProps = z.infer<typeof assemblySchema>;
export const assemblyDefaults: AssemblyProps = { name: "PATTERN STUDIO", site: "patternstudio.app", music: "" };

// Local CC0 SFX (public/sfx/) timed to the visual hits. Global frames account
// for the 15-frame transition overlaps between sequences.
const SFX: { at: number; src: string; vol: number }[] = [
  { at: 14, src: "sfx/whoosh.wav", vol: 0.7 }, // title blocks slap in
  { at: 140, src: "sfx/whip.wav", vol: 0.6 }, // "behind the scenes"
  { at: 208, src: "sfx/page-turn.wav", vol: 0.55 }, // app window opens
  { at: 346, src: "sfx/switch.wav", vol: 0.8 }, // scene card inserts
  { at: 466, src: "sfx/ding.wav", vol: 0.7 }, // end card
];

const S1 = 150; // title
const S2 = 90; // painted scene
const S3 = 270; // app
const S4 = 90; // end card
const T = 15;
export const ASSEMBLY_DURATION = S1 + S2 + S3 + S4 - 3 * T; // 555

const OrangeBlock: React.FC<{ children: React.ReactNode; size?: number; delay?: number }> = ({
  children,
  size = 110,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const clip = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
  return (
    <div style={{ clipPath: clip, WebkitClipPath: clip, alignSelf: "center" }}>
      <span
        style={{
          display: "inline-block",
          fontFamily: ANTON,
          fontSize: size,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: PALETTE.ink,
          background: PALETTE.red,
          padding: "6px 24px 14px",
        }}
      >
        {children}
      </span>
    </div>
  );
};

// Scene 2 — painted "behind the scenes" in his palette.
const PaintedScene: React.FC = () => (
  <AbsoluteFill>
    <PaintedImage src={staticFile("images/scene.jpg")} name="assembly" />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 8 }}>
      <OrangeBlock delay={6}>BEHIND</OrangeBlock>
      <OrangeBlock delay={12}>THE SCENES</OrangeBlock>
    </AbsoluteFill>
    <GrainOverlay name="ps" intensity={0.1} />
  </AbsoluteFill>
);

// Scene 4 — end card: red field, black/white blocks.
const EndCard: React.FC<{ name: string; site: string }> = ({ name, site }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const b = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.red, justifyContent: "center", alignItems: "center", gap: 14 }}>
      <div style={{ opacity: a, transform: `translateY(${interpolate(a, [0, 1], [20, 0])}px)` }}>
        <span style={{ fontFamily: ANTON, fontSize: 96, color: PALETTE.ink, textTransform: "uppercase", letterSpacing: 1 }}>
          {name}
        </span>
      </div>
      <div style={{ opacity: b }}>
        <span style={{ fontFamily: ANTON, fontSize: 30, color: "#fff", background: PALETTE.ink, padding: "6px 16px 9px", letterSpacing: 2 }}>
          {site.toUpperCase()}
        </span>
      </div>
      <GrainOverlay name="end" intensity={0.12} vignette={false} />
    </AbsoluteFill>
  );
};

export const Assembly: React.FC<AssemblyProps> = ({ name, site, music }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {/* Lo-fi music bed (drop a track in public/sfx/ and set the `music` prop) */}
      {music ? <Audio src={staticFile(music)} volume={0.55} /> : null}

      {/* SFX hits on the visual beats */}
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.at}>
          <Audio src={staticFile(s.src)} volume={s.vol} />
        </Sequence>
      ))}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S1}>
          <DesignerInJapan
            lines={["PATTERN", "STUDIO"]}
            byline="MOTION, FROM A PROMPT"
            blockColor={PALETTE.red}
            textColor={PALETTE.ink}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={S2}>
          <PaintedScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={S3}>
          <ScriptingApp appName="script engine" accent={PALETTE.red} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={S4}>
          <EndCard name={name} site={site} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
