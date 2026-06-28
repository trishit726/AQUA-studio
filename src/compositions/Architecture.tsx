// Architecture — a narrated ~34s explainer of how Aqua Studio works, in the
// signature editorial style: orange marker-slap blocks for each component, a
// scattered geometric-shape backdrop, heavy condensed caps, grain. Data packets
// (little tiles) flow along the connectors as the voiceover walks the pipeline.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { z } from "zod";
import { GrainOverlay } from "../lib/textures";
import { Shape } from "../lib/patterngen/PatternField";
import { mulberry32, ANIM_TYPES } from "../lib/patterngen/engine";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const architectureSchema = z.object({
  music: z.string().optional(),
  voiceover: z.string().optional(),
  accent: z.string().optional(),
});
export type ArchitectureProps = z.infer<typeof architectureSchema>;
export const architectureDefaults: ArchitectureProps = {
  music: "music/lofi.mp3",
  voiceover: "music/architecture-vo.mp3",
  accent: "#e0573a",
};
export const ARCH_DURATION = 1040;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const COLORS = ["#6fa5a9", "#93ab5a", "#cf9f4a", "#e0573a", "#ffffff", "#000000"];

type Node = { x: number; y: number; label: string; sub: string; color: string; appear: number };
const NODES: Record<string, Node> = {
  you: { x: 210, y: 540, label: "YOU", sub: "one-line prompt", color: "#e6dcc3", appear: 150 },
  editor: { x: 575, y: 540, label: "EDITOR", sub: "React · Vite", color: "#6fa5a9", appear: 230 },
  server: { x: 985, y: 540, label: "RENDER\nSERVER", sub: "Express :3001", color: "#e0573a", appear: 300 },
  gemini: { x: 985, y: 215, label: "GEMINI AI", sub: "designs the scene", color: "#cf9f4a", appear: 360 },
  preview: { x: 575, y: 860, label: "LIVE\nPREVIEW", sub: "Remotion Player", color: "#93ab5a", appear: 545 },
  remotion: { x: 1410, y: 540, label: "REMOTION", sub: "bundle + render", color: "#e0573a", appear: 705 },
  mp4: { x: 1745, y: 540, label: "MP4", sub: "out/*.mp4", color: "#cf9f4a", appear: 800 },
};

const LINES: [string, string, string?][] = [
  ["you", "editor"],
  ["editor", "server", "/generate"],
  ["server", "gemini", "scene JSON"],
  ["editor", "preview", "live edit"],
  ["server", "remotion", "/render"],
  ["remotion", "mp4"],
];

type Pulse = { from: string; to: string; s: number; e: number };
const PULSES: Pulse[] = [
  { from: "you", to: "editor", s: 195, e: 275 },
  { from: "editor", to: "server", s: 270, e: 350 },
  { from: "server", to: "gemini", s: 350, e: 420 },
  { from: "gemini", to: "server", s: 420, e: 505 },
  { from: "server", to: "editor", s: 505, e: 565 },
  { from: "editor", to: "preview", s: 550, e: 645 },
  { from: "editor", to: "server", s: 705, e: 775 },
  { from: "server", to: "remotion", s: 760, e: 845 },
  { from: "remotion", to: "mp4", s: 835, e: 925 },
];

const CAPTIONS: { s: number; e: number; text: string }[] = [
  { s: 150, e: 200, text: "You describe your brand in one line." },
  { s: 200, e: 350, text: "The editor sends it to a local render server." },
  { s: 350, e: 545, text: "The server calls Gemini — a full scene, returned as JSON." },
  { s: 545, e: 705, text: "The scene drops into a live Remotion preview. Edit anything." },
  { s: 705, e: 925, text: "One click renders it with Remotion into an MP4." },
  { s: 925, e: ARCH_DURATION, text: "From a sentence, to a video." },
];

const Block: React.FC<{ n: Node; reveal: number; active: boolean; frame: number }> = ({ n, reveal, active, frame }) => {
  const clip = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
  const pulse = active ? 0.05 + 0.05 * Math.sin(frame * 0.35) : 0;
  return (
    <div style={{ position: "absolute", left: n.x, top: n.y, transform: "translate(-50%, -50%)", textAlign: "center" }}>
      <div style={{ clipPath: clip, WebkitClipPath: clip, transform: `scale(${1 + pulse})`, transformOrigin: "center" }}>
        <div style={{ display: "inline-block", background: n.color, color: "#111", fontFamily: ANTON, fontSize: 38, letterSpacing: 1, textTransform: "uppercase", lineHeight: 0.92, padding: "9px 22px 14px", boxShadow: active ? "0 10px 30px rgba(0,0,0,0.55)" : "none" }}>
          {n.label.split("\n").map((l, i) => (<React.Fragment key={i}>{l}{i < n.label.split("\n").length - 1 && <br />}</React.Fragment>))}
        </div>
        <div style={{ marginTop: 7 }}>
          <span style={{ display: "inline-block", background: "#111", color: "#fff", fontFamily: ANTON, fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", padding: "3px 10px 5px" }}>{n.sub}</span>
        </div>
      </div>
    </div>
  );
};

export const Architecture: React.FC<ArchitectureProps> = ({ music, voiceover, accent = "#e0573a" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (id: string) => ({ x: NODES[id].x, y: NODES[id].y });
  const titleReveal = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const titleO = frame < 145 ? clamp(frame / 14) * clamp((145 - frame) / 22) : 0;

  // scattered geometric backdrop
  const bg: React.ReactNode[] = [];
  {
    const rand = mulberry32(77);
    for (let i = 0; i < 52; i++) {
      const x = rand() * 1920, y = rand() * 1080, s = 24 + rand() * 34;
      const anim = ANIM_TYPES[Math.floor(rand() * ANIM_TYPES.length)];
      const color = COLORS[Math.floor(rand() * COLORS.length)];
      const delay = 8 + rand() * 60;
      const p = clamp((frame - delay) / 10);
      if (p <= 0) continue;
      bg.push(
        <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, background: color, opacity: 0.5 * p, transform: `scale(${p})` }}>
          <Shape anim={anim} fg={color === "#000000" ? "#fff" : "#111"} />
        </div>,
      );
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#201712", overflow: "hidden" }}>
      {voiceover ? <Audio src={staticFile(voiceover)} volume={1} /> : null}
      {music ? <Audio src={staticFile(music)} volume={0.1} /> : null}

      {bg}

      {/* connectors + flowing tile packets (behind nodes) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {LINES.map(([a, b, label]) => {
          const appearAt = Math.max(NODES[a].appear, NODES[b].appear);
          if (frame < appearAt) return null;
          const o = clamp((frame - appearAt) / 12);
          const A = c(a), B = c(b);
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          return (
            <g key={`${a}-${b}`}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#e6dcc3" strokeWidth={4} opacity={o * 0.85} />
              {label ? <text x={mx} y={my - 14} fill="#e6dcc3" fontSize={19} fontFamily={ANTON} textAnchor="middle" opacity={o} letterSpacing={1}>{label.toUpperCase()}</text> : null}
            </g>
          );
        })}
        {PULSES.map((p, i) => {
          if (frame < p.s || frame >= p.e) return null;
          const A = c(p.from), B = c(p.to);
          return [0, 1, 2].map((k) => {
            const t = (((frame - p.s) / 22) + k * 0.34) % 1;
            const x = A.x + (B.x - A.x) * t, y = A.y + (B.y - A.y) * t;
            return <rect key={`${i}-${k}`} x={x - 8} y={y - 8} width={16} height={16} fill={accent} />;
          });
        })}
      </svg>

      {/* nodes as marker-slap blocks */}
      {Object.entries(NODES).map(([id, n]) => {
        const reveal = spring({ frame: frame - n.appear, fps, config: { damping: 200 } });
        if (reveal <= 0) return null;
        const active = PULSES.some((pl) => frame >= pl.s && frame < pl.e && (pl.from === id || pl.to === id));
        return <Block key={id} n={n} reveal={reveal} active={active} frame={frame} />;
      })}

      {/* title block */}
      {titleO > 0 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: titleO }}>
          <div style={{ clipPath: `inset(0 ${(1 - titleReveal) * 100}% 0 0)`, textAlign: "center" }}>
            <span style={{ display: "inline-block", background: accent, color: "#111", fontFamily: ANTON, fontSize: 150, lineHeight: 0.88, textTransform: "uppercase", letterSpacing: 1, padding: "12px 38px 24px" }}>HOW IT<br />WORKS</span>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* captions */}
      {CAPTIONS.map((cap, i) => {
        if (frame < cap.s || frame >= cap.e) return null;
        const o = clamp((frame - cap.s) / 8) * clamp((cap.e - frame) / 8);
        return (
          <div key={i} style={{ position: "absolute", bottom: 58, left: 0, right: 0, textAlign: "center", opacity: o }}>
            <span style={{ fontFamily: ANTON, fontSize: 38, color: accent, letterSpacing: 1, textShadow: "0 2px 14px rgba(0,0,0,0.85)" }}>{cap.text}</span>
          </div>
        );
      })}

      <GrainOverlay name="arch" intensity={0.1} vignette dark />
    </AbsoluteFill>
  );
};
