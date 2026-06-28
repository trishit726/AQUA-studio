// Examples — a ~28s montage showcasing the range of scenes Aqua Studio designs
// from a one-line prompt. Each example shows its prompt, then the result, with the
// signature transitions and a lo-fi bed.
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

export const examplesSchema = z.object({ music: z.string().optional() });
export type ExamplesProps = z.infer<typeof examplesSchema>;
export const examplesDefaults: ExamplesProps = { music: "music/lofi.mp3" };

const clamp = (v: number) => Math.max(0, Math.min(1, v));

const scene = (over: Partial<PatternTitleProps>): PatternTitleProps => ({ ...patternTitleDefaults, music: "", sfx: false, ...over });
const sc = (block: string, label: string, accent: string, bgColor: string, colors: string[], seed: number, extra: Partial<PatternTitleProps> = {}): PatternTitleProps =>
  scene({
    titles: [
      { id: "a", kind: "block", text: block, x: 0.37, y: 0.46, size: 130 },
      { id: "b", kind: "label", text: label, x: 0.37, y: 0.61, size: 30 },
    ],
    accent, bgColor, colors, seed, ...extra,
  });

const EX: { prompt: string; props: PatternTitleProps }[] = [
  { prompt: "a warm, rustic coffee roaster", props: sc("EMBER\nCOFFEE", "ROASTED WITH PASSION", "#e0573a", "#241a14", ["#cf9f4a", "#e0573a", "#a87f5d", "#6fa5a9"], 8) },
  { prompt: "an AI infrastructure startup", props: sc("NEURAL\nFORGE", "INTELLIGENCE, SHIPPED", "#3fd6c2", "#0e1117", ["#3fd6c2", "#5b8def", "#9b6dff", "#ffffff"], 21) },
  { prompt: "a high-energy fitness brand", props: sc("IRON\nPULSE", "TRAIN. RECOVER. REPEAT.", "#c6f24e", "#14181d", ["#c6f24e", "#e0573a", "#ffffff", "#888888"], 33) },
  { prompt: "a luxury couture atelier", props: sc("MAISON\nNOIR", "ATELIER COUTURE", "#d8b25a", "#efe9dd", ["#d8b25a", "#1a1a1a", "#a87f5d", "#6fa5a9"], 12) },
  { prompt: "a summer music festival", props: sc("NEON\nNIGHTS", "LIVE  •  THIS SUMMER", "#ff5db1", "#1a0f2e", ["#ff5db1", "#7b5bff", "#3fd6c2", "#ffd23f"], 45, { intro: "flood", floodStyle: "radial" }) },
  { prompt: "an outdoor travel brand", props: sc("WILD\nNORTH", "ADVENTURE AWAITS", "#f0a541", "#123b3a", ["#f0a541", "#6fa5a9", "#e6dcc3", "#e0573a"], 7) },
];

const PromptCaption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const clip = `inset(0 ${(1 - r) * 100}% 0 0)`;
  return (
    <div style={{ position: "absolute", top: 58, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ clipPath: clip, WebkitClipPath: clip, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ background: "#111", color: "#fff", fontFamily: ANTON, fontSize: 24, letterSpacing: 2, textTransform: "uppercase", padding: "6px 14px 9px" }}>PROMPT</span>
        <span style={{ background: "#e6dcc3", color: "#111", fontFamily: ANTON, fontSize: 24, letterSpacing: 1, padding: "6px 16px 9px" }}>{`“${text}”`}</span>
      </div>
    </div>
  );
};

const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#201712", justifyContent: "center", alignItems: "center" }}>
      <div style={{ clipPath: `inset(0 ${(1 - r) * 100}% 0 0)`, textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "#e0573a", color: "#111", fontFamily: ANTON, fontSize: 120, lineHeight: 0.9, textTransform: "uppercase", letterSpacing: 1, padding: "12px 34px 22px" }}>FROM ONE<br />SENTENCE</span>
      </div>
      <div style={{ marginTop: 22, opacity: clamp((frame - 24) / 12) }}>
        <span style={{ background: "#111", color: "#fff", fontFamily: ANTON, fontSize: 28, letterSpacing: 2, textTransform: "uppercase", padding: "5px 16px 8px" }}>SIX BRANDS, DESIGNED BY AI</span>
      </div>
      <GrainOverlay name="ex-intro" intensity={0.1} vignette dark />
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const b = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#e0573a", justifyContent: "center", alignItems: "center", gap: 18 }}>
      <div style={{ clipPath: `inset(0 ${(1 - a) * 100}% 0 0)` }}>
        <span style={{ fontFamily: ANTON, fontSize: 120, color: "#111", textTransform: "uppercase", letterSpacing: 1 }}>PATTERN STUDIO</span>
      </div>
      <div style={{ opacity: b }}><span style={{ fontFamily: ANTON, fontSize: 30, color: "#fff", background: "#111", padding: "6px 18px 9px", letterSpacing: 2 }}>DESCRIBE IT. RENDER IT.</span></div>
      <div style={{ opacity: b }}><span style={{ fontFamily: ANTON, fontSize: 24, color: "#111", letterSpacing: 1 }}>github.com/trishit726/Pattern-Studio</span></div>
      <GrainOverlay name="ex-end" intensity={0.12} vignette={false} />
    </AbsoluteFill>
  );
};

const T = 12;
const INTRO = 90, SCENE = 120, END = 110;
export const EXAMPLES_DURATION = INTRO + EX.length * SCENE + END - (EX.length + 1) * T; // 836

export const Examples: React.FC<ExamplesProps> = ({ music }) => {
  const children: React.ReactNode[] = [];
  children.push(
    <TransitionSeries.Sequence key="intro" durationInFrames={INTRO}><IntroCard /></TransitionSeries.Sequence>,
    <TransitionSeries.Transition key="ti" presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />,
  );
  EX.forEach((ex, i) => {
    children.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={SCENE}>
        <AbsoluteFill>
          <PatternTitle {...ex.props} />
          <PromptCaption text={ex.prompt} />
        </AbsoluteFill>
      </TransitionSeries.Sequence>,
      <TransitionSeries.Transition key={`t${i}`} presentation={i % 2 === 0 ? slide({ direction: "from-right" }) : fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />,
    );
  });
  children.push(
    <TransitionSeries.Sequence key="end" durationInFrames={END}><EndCard /></TransitionSeries.Sequence>,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {music ? <Audio src={staticFile(music)} volume={0.5} /> : null}
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};
