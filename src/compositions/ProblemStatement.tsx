// ProblemStatement — a long (~71s) narrated explainer of the problem Pattern
// Studio solves, in the signature editorial style: bold marker-slap statement
// blocks + scattered-shape backdrops, timed to the voiceover.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { z } from "zod";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { GrainOverlay } from "../lib/textures";
import { Shape } from "../lib/patterngen/PatternField";
import { mulberry32, ANIM_TYPES } from "../lib/patterngen/engine";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const problemSchema = z.object({
  music: z.string().optional(),
  voiceover: z.string().optional(),
});
export type ProblemProps = z.infer<typeof problemSchema>;
export const problemDefaults: ProblemProps = { music: "music/lofi.mp3", voiceover: "music/problem-vo.mp3" };

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const COLORS = ["#6fa5a9", "#93ab5a", "#cf9f4a", "#e0573a", "#ffffff", "#000000"];

const ScatterBg: React.FC<{ seed: number }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const rand = mulberry32(seed >>> 0);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const x = rand() * 1920, y = rand() * 1080, s = 24 + rand() * 34;
    const anim = ANIM_TYPES[Math.floor(rand() * ANIM_TYPES.length)];
    const color = COLORS[Math.floor(rand() * COLORS.length)];
    const delay = 4 + rand() * 28;
    const p = clamp((frame - delay) / 10);
    if (p <= 0) continue;
    out.push(
      <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, background: color, opacity: 0.42 * p, transform: `scale(${p})` }}>
        <Shape anim={anim} fg={color === "#000000" ? "#fff" : "#111"} />
      </div>,
    );
  }
  return <>{out}</>;
};

type SceneDef = { dur: number; accent: string; bg: string; block: string; subs: string[] };
const SCENES: SceneDef[] = [
  { dur: 250, accent: "#e0573a", bg: "#201712", block: "EVERY BRAND\nNEEDS MOTION", subs: [] },
  { dur: 130, accent: "#cf9f4a", bg: "#1a1410", block: "BUT IT'S\nLOCKED AWAY", subs: [] },
  { dur: 310, accent: "#e0573a", bg: "#201712", block: "HIRE A\nDESIGNER?", subs: ["HUNDREDS OF DOLLARS", "FOR SECONDS OF VIDEO"] },
  { dur: 340, accent: "#6fa5a9", bg: "#13201f", block: "LEARN THE\nTOOLS?", subs: ["AFTER EFFECTS", "KEYFRAMES · EASING CURVES", "WEEKS OF PRACTICE"] },
  { dur: 310, accent: "#93ab5a", bg: "#161a10", block: "SO MOST\nPEOPLE SETTLE", subs: ["GENERIC TEMPLATES", "PLAIN STATIC TITLES", "OR NO MOTION AT ALL"] },
  { dur: 310, accent: "#e0573a", bg: "#201712", block: "OUT OF\nREACH", subs: ["FOR FOUNDERS", "FOR STUDENTS", "FOR SMALL CREATORS"] },
  { dur: 250, accent: "#cf9f4a", bg: "#1a1410", block: "TOO EXPENSIVE\nTOO HARD\nTOO GENERIC", subs: ["NO MIDDLE GROUND"] },
  { dur: 320, accent: "#e0573a", bg: "#201712", block: "THAT'S THE\nPROBLEM", subs: ["MOTION SHOULD BE AS EASY", "AS DESCRIBING IT"] },
];

const T = 12;
export const PROBLEM_DURATION = SCENES.reduce((a, s) => a + s.dur, 0) - (SCENES.length - 1) * T; // 2136

const StatementScene: React.FC<SceneDef & { seed: number }> = ({ accent, bg, block, subs, seed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const clip = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
  const lines = block.split("\n");
  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
      <ScatterBg seed={seed} />
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ clipPath: clip, WebkitClipPath: clip, display: "inline-block" }}>
          <span style={{ display: "inline-block", background: accent, color: "#111", fontFamily: ANTON, fontSize: lines.length > 2 ? 104 : 132, lineHeight: 0.92, textTransform: "uppercase", letterSpacing: 1, padding: "12px 34px 22px" }}>
            {lines.map((l, i) => (<React.Fragment key={i}>{l}{i < lines.length - 1 && <br />}</React.Fragment>))}
          </span>
        </div>
        {subs.length ? (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 11, alignItems: "center" }}>
            {subs.map((s, i) => {
              const r = spring({ frame: frame - (26 + i * 11), fps, config: { damping: 200 } });
              const c = `inset(0 ${(1 - r) * 100}% 0 0)`;
              return (
                <div key={i} style={{ clipPath: c, WebkitClipPath: c }}>
                  <span style={{ display: "inline-block", background: "#111", color: "#fff", fontFamily: ANTON, fontSize: 30, letterSpacing: 2, textTransform: "uppercase", padding: "5px 16px 8px" }}>{s}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <GrainOverlay name="prob" intensity={0.1} vignette dark />
    </AbsoluteFill>
  );
};

export const ProblemStatement: React.FC<ProblemProps> = ({ music, voiceover }) => {
  const children: React.ReactNode[] = [];
  SCENES.forEach((s, i) => {
    children.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={s.dur}>
        <StatementScene {...s} seed={i * 131 + 7} />
      </TransitionSeries.Sequence>,
    );
    if (i < SCENES.length - 1) {
      children.push(
        <TransitionSeries.Transition
          key={`t${i}`}
          presentation={i % 2 === 0 ? fade() : slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#201712" }}>
      {voiceover ? <Audio src={staticFile(voiceover)} volume={1} /> : null}
      {music ? <Audio src={staticFile(music)} volume={0.1} /> : null}
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};
