// Intro — a halfof8 "Designer, In Japan"-style opener, reverse-engineered from the
// reference intro. Five beats over a painterly hero shot:
//   1. Establishing: painterly alley (Ken Burns) + two-dot "eyes" + flanking labels
//      (title left, byline right).
//   2. The eyes settle / labels hold.
//   3. Awards stack: offset orange blocks, staggered marker-slap reveals.
//   4. Whip cut.
//   5. Runtime card: red "~5 MIN" bar over a painterly burst + X pattern motif.
//
// Fully parameterized → drives the web app. Drop a real photo into `bgImage`
// for the hero shot.
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
import { zColor } from "@remotion/zod-types";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadJP } from "@remotion/google-fonts/ShipporiMincho";
import { PaintedImage, GrainOverlay, PALETTE } from "../lib/textures";
import { Shape } from "../lib/patterngen/PatternField";

const resolveSrc = (s: string) => (/^(https?:|blob:|data:)/.test(s) ? s : staticFile(s));
const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: JP } = loadJP("normal", { weights: ["500"], subsets: ["latin"] });

export const introSchema = z.object({
  bgImage: z.string(), // public path / url for the painterly hero photo (entrance)
  bgImage2: z.string(), // second, deeper photo — the camera dollies forward into it
  paint: z.number().min(0).max(120), // SVG watercolor strength (0 = off)
  title: z.string(),
  byline: z.string(),
  jp: z.string(),
  eyesX: z.number().min(0).max(1),
  eyesY: z.number().min(0).max(1),
  awards: z.array(z.string()),
  runtime: z.string(),
  accent: zColor(),
  music: z.string().optional(),
  sfx: z.boolean().optional(),
});
export type IntroProps = z.infer<typeof introSchema>;

export const introDefaults: IntroProps = {
  bgImage: "images/images.jpeg", // entrance shot (lantern alley)
  bgImage2: "images/49488134237_6646d2f9d0_b.jpg", // deeper alley shot (people receding)
  paint: 70,
  title: "PATTERN STUDIO",
  byline: "MOTION GRAPHICS, FROM A PROMPT",
  jp: "",
  eyesX: 0.5,
  eyesY: 0.46,
  awards: ["AI BRANDING", "ONE PROMPT", "INSTANT MP4", "OPEN SOURCE"],
  runtime: "~2 MIN",
  accent: "#f74026",
  music: "",
  sfx: false,
};

// Scene lengths (30fps). MAIN holds beats 1–3 over one continuous hero shot;
// then a whip cut into the runtime card. Total = MAIN + RUNTIME - WHIP.
const MAIN = 350;
const RUNTIME = 168;
const WHIP = 18;
export const INTRO_DURATION = MAIN + RUNTIME - WHIP; // 500 (~16.7s)

// A marker-slap orange label: clip-wipes left→right, with a tiny overshoot drift.
const Label: React.FC<{
  text: string;
  delay: number;
  size: number;
  bg: string;
  color?: string;
  rot?: number;
}> = ({ text, delay, size, bg, color = PALETTE.ink, rot = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const clip = `inset(0 ${(1 - r) * 100}% 0 0)`;
  return (
    <div style={{ transform: `rotate(${rot}deg) translateX(${interpolate(r, [0, 1], [-12, 0])}px)`, clipPath: clip, WebkitClipPath: clip }}>
      <span
        style={{
          display: "inline-block",
          fontFamily: ANTON,
          fontSize: size,
          lineHeight: 1.0,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color,
          background: bg,
          padding: "4px 14px 8px",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Beats 1–3: hero shot, eyes + flanking labels, then the awards stack.
const HANDOFF = 178; // frame where the dolly passes from photo 1 into photo 2

const Establishing: React.FC<IntroProps> = ({ bgImage, bgImage2, paint, title, byline, jp, eyesX, eyesY, awards, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // FORWARD DOLLY — a continuous push-in (scale up toward the alley's vanishing
  // point) that hands off from the entrance photo to the deeper one mid-way, so
  // it reads as the camera travelling down the street. A brief motion-blur sells
  // the hand-off as acceleration.
  const z1 = interpolate(frame, [0, HANDOFF + 40], [1.05, 1.6], { extrapolateRight: "clamp" });
  const z2 = interpolate(frame, [HANDOFF - 24, MAIN], [1.12, 1.62], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o2 = bgImage2 ? interpolate(frame, [HANDOFF - 16, HANDOFF + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const blur = interpolate(frame, [HANDOFF - 16, HANDOFF, HANDOFF + 16], [0, 8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Two-dot "eyes" pop in, then the flanking labels slap in beside them.
  const eyes = spring({ frame: frame - 12, fps, config: { damping: 12, mass: 0.6 } });
  // Eyes + labels hold over photo 1, then fade as we push into photo 2 + awards.
  const heroFade = interpolate(frame, [148, 168], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const awardsIn = frame >= 188;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0b09", overflow: "hidden" }}>
      {/* photo 1 — entrance, pushing forward */}
      <AbsoluteFill style={{ transform: `scale(${z1})`, filter: blur ? `blur(${blur}px)` : undefined }}>
        <PaintedImage src={resolveSrc(bgImage)} name="intro1" strength={paint} kenBurns={false} />
      </AbsoluteFill>
      {/* photo 2 — deeper into the alley, continues the push */}
      {bgImage2 ? (
        <AbsoluteFill style={{ transform: `scale(${z2})`, filter: blur ? `blur(${blur}px)` : undefined, opacity: o2 }}>
          <PaintedImage src={resolveSrc(bgImage2)} name="intro2" strength={paint} kenBurns={false} />
        </AbsoluteFill>
      ) : null}

      {/* Beat 1–2: eyes + flanking labels (title left, byline right) */}
      <AbsoluteFill style={{ opacity: heroFade }}>
        <div
          style={{
            position: "absolute",
            left: `${eyesX * 100}%`,
            top: `${eyesY * 100}%`,
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ justifySelf: "end", display: "flex", justifyContent: "flex-end" }}>
            <Label text={title} delay={26} size={30} bg={accent} />
          </div>
          {/* the two orange "eyes" */}
          {[0, 1].map((d) => (
            <div
              key={d}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: accent,
                opacity: eyes,
                transform: `scale(${interpolate(eyes, [0, 1], [0.2, 1])})`,
              }}
            />
          ))}
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Label text={byline} delay={32} size={22} bg={accent} />
          </div>
        </div>

        {/* vertical Japanese accent, lower-right of the eyes */}
        {jp ? (
          <div style={{ position: "absolute", left: `${eyesX * 100 + 10}%`, top: `${eyesY * 100 + 8}%`, opacity: interpolate(eyes, [0, 1], [0, 1]) }}>
            <span style={{ display: "inline-block", writingMode: "vertical-rl", background: accent, color: PALETTE.ink, fontFamily: JP, fontSize: 30, fontWeight: 500, letterSpacing: 3, padding: "12px 6px" }}>
              {jp}
            </span>
          </div>
        ) : null}
      </AbsoluteFill>

      {/* Beat 3: awards stack — offset blocks, staggered marker-slap reveals */}
      {awardsIn ? (
        <AbsoluteFill>
          {awards.slice(0, AWARD_POS.length).map((a, i) => {
            const p = AWARD_POS[i];
            return (
              <div key={`${a}-${i}`} style={{ position: "absolute", left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: "translate(-50%, -50%)" }}>
                <Label text={a} delay={192 + i * 9} size={p.big ? 52 : 40} bg={accent} rot={p.rot} />
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}

      <GrainOverlay name="intro-main" intensity={0.12} vignette dark />
    </AbsoluteFill>
  );
};

// Clustered, slightly-offset award positions (centre of frame), echoing the reference.
const AWARD_POS = [
  { x: 0.40, y: 0.46, rot: -2, big: true },
  { x: 0.41, y: 0.57, rot: 1, big: false },
  { x: 0.55, y: 0.52, rot: -1, big: false },
  { x: 0.67, y: 0.45, rot: 2, big: false },
  { x: 0.67, y: 0.55, rot: -2, big: false },
  { x: 0.52, y: 0.64, rot: 1, big: false },
];

// Beat 5: runtime card — red "~N MIN" bar over a painterly burst + X / dot motif.
const RuntimeCard: React.FC<{ bgImage: string; paint: number; runtime: string; accent: string }> = ({ bgImage, paint, runtime, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bar = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const clip = `inset(0 ${(1 - bar) * 100}% 0 0)`;
  const flash = interpolate(frame, [0, 14], [0.9, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#16140f", overflow: "hidden" }}>
      {/* painterly burst: same hero, pushed in hard */}
      <AbsoluteFill style={{ transform: "scale(1.35)", filter: "saturate(0.7)" }}>
        <PaintedImage src={resolveSrc(bgImage)} name="intro-end" strength={paint} kenBurns={false} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#f2efe6", opacity: flash }} />

      {/* scattered X / dot pattern shapes pop in */}
      {RUNTIME_SHAPES.map((s, i) => {
        const pop = spring({ frame: frame - (10 + i * 4), fps, config: { damping: 14, mass: 0.6 } });
        return (
          <div key={i} style={{ position: "absolute", left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: `translate(-50%,-50%) scale(${pop * s.s})`, opacity: pop, width: 40, height: 40 }}>
            <Shape anim={s.anim} fg={s.fg === "accent" ? accent : s.fg} />
          </div>
        );
      })}

      {/* the red runtime bar */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ clipPath: clip, WebkitClipPath: clip, background: accent, padding: "10px 60px 18px" }}>
          <span style={{ fontFamily: ANTON, fontSize: 150, lineHeight: 1, letterSpacing: 2, textTransform: "uppercase", color: PALETTE.ink }}>
            {runtime}
          </span>
        </div>
      </AbsoluteFill>

      <GrainOverlay name="intro-end" intensity={0.14} vignette dark />
    </AbsoluteFill>
  );
};

const RUNTIME_SHAPES: { x: number; y: number; s: number; anim: "xCross" | "circle" | "dots3" | "target"; fg: string }[] = [
  { x: 0.2, y: 0.3, s: 2.4, anim: "xCross", fg: "accent" },
  { x: 0.82, y: 0.34, s: 2.0, anim: "circle", fg: "#fff" },
  { x: 0.74, y: 0.7, s: 2.6, anim: "xCross", fg: "#111" },
  { x: 0.28, y: 0.72, s: 1.8, anim: "dots3", fg: "accent" },
  { x: 0.5, y: 0.22, s: 1.6, anim: "target", fg: "#fff" },
];

export const Intro: React.FC<IntroProps> = (props) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {props.music ? <Audio src={resolveSrc(props.music)} volume={0.4} /> : null}

      {/* SFX: a slap when the eyes land, a hit when the runtime card slams in */}
      {props.sfx ? (
        <>
          <Sequence from={12}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.6} /></Sequence>
          <Sequence from={176}><Audio src={staticFile("sfx/whip.wav")} volume={0.5} /></Sequence>
          <Sequence from={MAIN - WHIP}><Audio src={staticFile("sfx/switch.wav")} volume={0.7} /></Sequence>
          <Sequence from={MAIN - WHIP + 8}><Audio src={staticFile("sfx/ding.wav")} volume={0.6} /></Sequence>
        </>
      ) : null}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={MAIN}>
          <Establishing {...props} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: WHIP })}
        />
        <TransitionSeries.Sequence durationInFrames={RUNTIME}>
          <RuntimeCard bgImage={props.bgImage2 || props.bgImage} paint={props.paint} runtime={props.runtime} accent={props.accent} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
