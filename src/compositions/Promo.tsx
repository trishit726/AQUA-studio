// Promo — a narrated ~37s product film for Aqua Studio, built entirely from
// the tool's own PatternTitle scenes (the halfof8-style editorial look) strung
// together with transitions, over an ElevenLabs/Edge voiceover + lo-fi bed.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { z } from "zod";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { PatternTitle, patternTitleDefaults, type PatternTitleProps } from "./PatternTitle";
import { GrainOverlay } from "../lib/textures";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const promoSchema = z.object({
  music: z.string().optional(),
  voiceover: z.string().optional(),
});
export type PromoProps = z.infer<typeof promoSchema>;
export const promoDefaults: PromoProps = { music: "music/lofi.mp3", voiceover: "music/voiceover.mp3" };

export const PROMO_DURATION = 1105; // ~36.8s, matches the voiceover

const T = 15; // transition length (frames)

// Build a full PatternTitle scene from a few overrides (no per-scene audio).
const scene = (over: Partial<PatternTitleProps>): PatternTitleProps => ({
  ...patternTitleDefaults,
  music: "",
  sfx: false,
  ...over,
});
const sc = (
  block: string,
  label: string,
  accent: string,
  bgColor: string,
  colors: string[],
  seed: number,
  extra: Partial<PatternTitleProps> = {},
): PatternTitleProps =>
  scene({
    titles: [
      { id: "a", kind: "block", text: block, x: 0.37, y: 0.46, size: 130 },
      { id: "b", kind: "label", text: label, x: 0.37, y: 0.61, size: 30 },
    ],
    accent,
    bgColor,
    colors,
    seed,
    ...extra,
  });

const SCENES: { dur: number; props: PatternTitleProps }[] = [
  { dur: 200, props: sc("PATTERN\nSTUDIO", "MOTION, FROM A PROMPT", "#e0573a", "#241a14", ["#cf9f4a", "#e0573a", "#6fa5a9", "#ffffff"], 8, { intro: "flood", floodStyle: "random", floodSpeed: 6 }) },
  { dur: 185, props: sc("EMBER\nCOFFEE", "ROASTED WITH PASSION", "#e0573a", "#241a14", ["#cf9f4a", "#e0573a", "#a87f5d", "#6fa5a9"], 8) },
  { dur: 185, props: sc("NEURAL\nFORGE", "INTELLIGENCE, SHIPPED", "#3fd6c2", "#0e1117", ["#3fd6c2", "#5b8def", "#9b6dff", "#ffffff"], 21) },
  { dur: 185, props: sc("NEON\nNIGHTS", "LIVE  •  THIS SUMMER", "#ff5db1", "#1a0f2e", ["#ff5db1", "#7b5bff", "#3fd6c2", "#ffd23f"], 45, { intro: "flood", floodStyle: "radial", floodSpeed: 5 }) },
  { dur: 185, props: sc("WILD\nNORTH", "ADVENTURE AWAITS", "#f0a541", "#123b3a", ["#f0a541", "#6fa5a9", "#e6dcc3", "#e0573a"], 7) },
];

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const b = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  const c = spring({ frame: frame - 30, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#e0573a", justifyContent: "center", alignItems: "center", gap: 20 }}>
      <div style={{ clipPath: `inset(0 ${(1 - a) * 100}% 0 0)` }}>
        <span style={{ fontFamily: ANTON, fontSize: 120, color: "#111", textTransform: "uppercase", letterSpacing: 1 }}>AQUA STUDIO</span>
      </div>
      <div style={{ opacity: b }}>
        <span style={{ fontFamily: ANTON, fontSize: 32, color: "#fff", background: "#111", padding: "6px 18px 9px", letterSpacing: 2 }}>OPEN SOURCE · MADE FOR EVERYONE</span>
      </div>
      <div style={{ opacity: c }}>
        <span style={{ fontFamily: ANTON, fontSize: 26, color: "#111", letterSpacing: 1 }}>github.com/trishit726/Pattern-Studio</span>
      </div>
      <GrainOverlay name="promo-end" intensity={0.12} vignette={false} />
    </AbsoluteFill>
  );
};

export const Promo: React.FC<PromoProps> = ({ music, voiceover }) => {
  const children: React.ReactNode[] = [];
  SCENES.forEach((s, i) => {
    children.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={s.dur}>
        <PatternTitle {...s.props} />
      </TransitionSeries.Sequence>,
    );
    children.push(
      <TransitionSeries.Transition
        key={`t${i}`}
        presentation={i % 2 === 0 ? fade() : slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
      />,
    );
  });
  children.push(
    <TransitionSeries.Sequence key="end" durationInFrames={240}>
      <EndCard />
    </TransitionSeries.Sequence>,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {voiceover ? <Audio src={staticFile(voiceover)} volume={1} /> : null}
      {music ? <Audio src={staticFile(music)} volume={0.12} /> : null}
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};
