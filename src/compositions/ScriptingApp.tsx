// ScriptingApp — a tribute to the *feel* of Anon's (halfof8) scripting app.
// Not the cubes — the thing he actually obsesses over: physical micro-interactions.
// Scene cards assemble into a timeline with weighted overshoot, then a new scene
// inserts and pushes the others down "like it has weight," with a cursor + a
// "+" pulse. Every motion uses spring() with a little bounce for tactility.
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
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { FONT_FAMILY as INTER } from "../lib/fonts";
import { Backdrop, GrainOverlay } from "../lib/textures";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const scriptingAppSchema = z.object({
  appName: z.string(),
  accent: zColor(),
});
export type ScriptingAppProps = z.infer<typeof scriptingAppSchema>;
export const scriptingAppDefaults: ScriptingAppProps = {
  appName: "script engine",
  accent: "#f74026",
};

type Scene = { n: string; title: string; dur: string; vo: string; tags: string[] };

const SCENES: Scene[] = [
  { n: "01", title: "OPENING", dur: "0:08", vo: "Hello from Tokyo. My name is Anon.", tags: ["VO", "GFX"] },
  { n: "02", title: "THE JOURNAL", dur: "0:12", vo: "For years I've kept a design journal.", tags: ["VO", "REF"] },
  { n: "03", title: "WORKFLOW", dur: "0:21", vo: "Behind the scenes of my YouTube workflow.", tags: ["VO", "GFX", "REF"] },
  { n: "04", title: "OUTRO", dur: "0:15", vo: "Consistency becomes a design problem.", tags: ["VO", "MUSIC"] },
];
const INSERTED: Scene = {
  n: "··", title: "MICRO-INTERACTIONS", dur: "0:10", vo: "The layout pushes like it has weight.", tags: ["VO", "GFX"],
};
const INSERT_IDX = 1; // new scene drops in after OPENING; everything below pushes down

// Layout
const WIN_W = 1180;
const WIN_H = 860;
const TITLEBAR = 60;
const LIST_TOP = 150;
const PAD = 70;
const CARD_W = WIN_W - PAD * 2;
const CARD_H = 116;
const GAP = 16;
const STEP = CARD_H + GAP;

const ASSEMBLY_START = 26;
const STAGGER = 11;
const T_INSERT = 138;

const Chip: React.FC<{ label: string; accent: string }> = ({ label, accent }) => (
  <span
    style={{
      fontFamily: INTER,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 0.5,
      color: label === "VO" ? "#fff" : "#6b6557",
      background: label === "VO" ? accent : "#ece7db",
      borderRadius: 6,
      padding: "3px 9px",
    }}
  >
    {label}
  </span>
);

const Card: React.FC<{
  scene: Scene;
  y: number;
  opacity: number;
  scale: number;
  active: boolean;
  accent: string;
}> = ({ scene, y, opacity, scale, active, accent }) => (
  <div
    style={{
      position: "absolute",
      left: PAD,
      top: y,
      width: CARD_W,
      height: CARD_H,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: "center",
      background: "#fefdfb",
      borderRadius: 14,
      border: `1px solid ${active ? accent : "#e6e1d5"}`,
      boxShadow: active
        ? `0 12px 30px ${accent}33`
        : "0 6px 16px rgba(0,0,0,0.05)",
      display: "flex",
      overflow: "hidden",
    }}
  >
    <div style={{ width: 6, background: active ? accent : "#d9d3c6" }} />
    <div style={{ flex: 1, padding: "16px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          style={{
            fontFamily: ANTON,
            fontSize: 18,
            color: "#fff",
            background: "#1c1a17",
            borderRadius: 6,
            padding: "2px 10px",
            minWidth: 34,
            textAlign: "center",
          }}
        >
          {scene.n}
        </span>
        <span style={{ fontFamily: ANTON, fontSize: 30, color: "#1c1a17", letterSpacing: 0.5, flex: 1 }}>
          {scene.title}
        </span>
        <span
          style={{
            fontFamily: INTER,
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            background: accent,
            borderRadius: 8,
            padding: "4px 12px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {scene.dur}
        </span>
      </div>
      <div style={{ fontFamily: INTER, fontSize: 16, color: "#8a8578" }}>{scene.vo}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {scene.tags.map((t) => (
          <Chip key={t} label={t} accent={accent} />
        ))}
      </div>
    </div>
  </div>
);

export const ScriptingApp: React.FC<ScriptingAppProps> = ({ appName, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Window entrance.
  const winIn = spring({ frame, fps, config: { damping: 18 } });
  const winScale = interpolate(winIn, [0, 1], [0.965, 1]);

  // Insert push — weighted, with a touch of overshoot ("like it has weight").
  const push = spring({ frame: frame - T_INSERT, fps, config: { damping: 16, mass: 1.0, stiffness: 110 } });
  // Inserted card drop-in.
  const drop = spring({ frame: frame - (T_INSERT + 3), fps, config: { damping: 12, mass: 0.8 } });

  // Cursor travels to the insert gap just before the insert fires.
  const cursorProg = interpolate(frame, [104, T_INSERT], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const cursorY = interpolate(cursorProg, [0, 1], [LIST_TOP - 30, LIST_TOP + STEP - 8]);
  const plusPulse = spring({ frame: frame - T_INSERT, fps, config: { damping: 9, mass: 0.5 } });

  const exit = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const winLeft = (1920 - WIN_W) / 2;
  const winTop = (1080 - WIN_H) / 2;

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {/* Shared painterly desk backdrop */}
      <Backdrop variant="painterly" />

      <div
        style={{
          position: "absolute",
          left: winLeft,
          top: winTop,
          width: WIN_W,
          height: WIN_H,
          background: "#f1ede4",
          borderRadius: 22,
          boxShadow: "0 50px 110px rgba(0,0,0,0.28)",
          opacity: winIn,
          transform: `scale(${winScale})`,
          transformOrigin: "center",
          overflow: "hidden",
        }}
      >
        {/* title bar */}
        <div style={{ height: TITLEBAR, display: "flex", alignItems: "center", padding: "0 22px", borderBottom: "1px solid #e6e1d5" }}>
          <div style={{ display: "flex", gap: 9 }}>
            {["#e26d5a", "#e8c15a", "#9ab87f"].map((c) => (
              <div key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, textAlign: "center", fontFamily: ANTON, fontSize: 18, letterSpacing: 2, color: "#1c1a17" }}>
            {appName.toUpperCase()} · 脚本
          </div>
          <div style={{ width: 60 }} />
        </div>

        {/* header row */}
        <div style={{ position: "absolute", top: TITLEBAR + 24, left: PAD, right: PAD, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontFamily: ANTON, fontSize: 40, color: "#1c1a17", letterSpacing: 0.5 }}>SCRIPT</span>
          <span style={{ fontFamily: INTER, fontSize: 16, color: "#8a8578", fontWeight: 600 }}>
            {SCENES.length + (frame >= T_INSERT ? 1 : 0)} scenes · {frame >= T_INSERT ? "1:06" : "0:56"}
          </span>
        </div>

        {/* original scene cards */}
        {SCENES.map((scene, oi) => {
          const appear = spring({ frame: frame - (ASSEMBLY_START + oi * STAGGER), fps, config: { damping: 12, mass: 0.7, stiffness: 130 } });
          const slot = oi < INSERT_IDX ? oi : oi + push; // cards below the insert get pushed down
          const baseY = LIST_TOP + slot * STEP;
          const enterOffset = (1 - appear) * 44;
          const opacity = interpolate(frame, [ASSEMBLY_START + oi * STAGGER, ASSEMBLY_START + oi * STAGGER + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <Card
              key={scene.n}
              scene={scene}
              y={baseY + enterOffset}
              opacity={opacity}
              scale={interpolate(appear, [0, 1], [0.97, 1])}
              active={false}
              accent={accent}
            />
          );
        })}

        {/* the inserted scene */}
        {frame >= T_INSERT && (
          <Card
            scene={INSERTED}
            y={LIST_TOP + INSERT_IDX * STEP + interpolate(drop, [0, 1], [-26, 0])}
            opacity={interpolate(frame, [T_INSERT + 2, T_INSERT + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            scale={interpolate(drop, [0, 1], [0.9, 1])}
            active
            accent={accent}
          />
        )}

        {/* cursor + "+" badge */}
        {frame >= 100 && frame < T_INSERT + 26 && (
          <div style={{ position: "absolute", left: PAD + 26, top: cursorY, transform: "translateZ(0)" }}>
            {/* the new-row "+" affordance */}
            <div
              style={{
                position: "absolute",
                left: -10,
                top: -10,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: accent,
                color: "#fff",
                fontFamily: INTER,
                fontSize: 22,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${interpolate(plusPulse, [0, 1], [0.6, 1])})`,
                opacity: frame >= T_INSERT - 8 ? 1 : 0.85,
                boxShadow: `0 4px 12px ${accent}66`,
              }}
            >
              +
            </div>
            {/* pointer */}
            <svg width="26" height="30" viewBox="0 0 26 30" style={{ position: "absolute", left: 16, top: 12 }}>
              <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 16 L20 16 Z" fill="#1c1a17" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Grain over everything — ties the UI into the same world as the title cards. */}
      <GrainOverlay name="app" intensity={0.1} vignette={false} />
    </AbsoluteFill>
  );
};
