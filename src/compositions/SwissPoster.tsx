// SwissPoster — an International Typographic Style ("Swiss") poster, built on the
// Armature Engine (asymmetricCross). The whole layout hangs off a seeded geometric
// skeleton: one dominant diagonal axis + a perpendicular counter axis crossing at
// a node. The two display words read ACROSS that node; structural bars ride
// parallels of the axes; an optional right-angle accent path turns at the node.
//
// Design rules on purpose:
//   • One typeface, heavy. Type runs along the axis, not flat.
//   • Hard grid rotated off-square. Asymmetry with intent. Negative space.
//   • Paper / ink / one accent. Motion = wipes + bar scales along the axis.
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
import { FONT_FAMILY } from "../lib/fonts";
import { seconds } from "../config";
import { composeArmature, type Bar } from "../engine/armature";

export const SWISS_POSTER_DURATION = seconds(6);

export const swissPosterSchema = z.object({
  // ── Content ────────────────────────────────────────────────────────────────
  kicker: z.string(), // small tracked label, top-left
  year: z.string(), // marker on the top rule
  headlineTop: z.string(), // word that reads along the primary axis
  headlineBottom: z.string(), // word that reads along the counter axis
  metaLines: z.array(z.string()), // rotated metadata column
  footer: z.string(), // vertical label, right edge
  // ── Geometry (Armature controls) ────────────────────────────────────────────
  seed: z.number().int(),
  angle: z.number().min(-90).max(90), // primary axis angle
  counterAxis: z.boolean(), // emit the perpendicular counter axis (the cross)
  nodeX: z.number().min(20).max(80), // crossing-node X (%)
  nodeY: z.number().min(20).max(80), // crossing-node Y (%)
  barCount: z.number().int().min(0).max(40), // scattered structural bars
  elbow: z.boolean(), // right-angle accent path through the node
  headlineSize: z.number().min(80).max(420), // display type size (px)
  // ── Colour ──────────────────────────────────────────────────────────────────
  paperColor: zColor(),
  inkColor: zColor(),
  accentColor: zColor(),
});

export type SwissPosterProps = z.infer<typeof swissPosterSchema>;

export const swissPosterDefaults: SwissPosterProps = {
  kicker: "INTERNATIONAL TYPOGRAPHIC STYLE",
  year: "1957",
  headlineTop: "FONT",
  headlineBottom: "HEADING",
  metaLines: [
    "Order, white space, precision.",
    "Form follows function.",
    "The grid is structure, not decoration.",
  ],
  footer: "DESIGNER WITH IMPACT",
  seed: 7,
  angle: -52,
  counterAxis: true,
  nodeX: 50,
  nodeY: 48,
  barCount: 10,
  elbow: true,
  headlineSize: 230,
  paperColor: "#0e0e10", // near-black paper
  inkColor: "#f2efe6",
  accentColor: "#e2231a", // Swiss red
};

// Clip a (rotated) element along its own reading direction — the wipe runs along
// the axis because clip-path is applied in the element's local box, pre-transform.
const wipeAlong = (p: number): React.CSSProperties => {
  const r = (1 - p) * 100;
  return { clipPath: `inset(0 ${r}% 0 0)`, WebkitClipPath: `inset(0 ${r}% 0 0)` };
};

export const SwissPoster: React.FC<SwissPosterProps> = ({
  kicker,
  year,
  headlineTop,
  headlineBottom,
  metaLines,
  footer,
  seed,
  angle,
  counterAxis,
  nodeX,
  nodeY,
  barCount,
  elbow,
  headlineSize,
  paperColor,
  inkColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // The geometric skeleton everything hangs off.
  const arm = composeArmature(
    { angle, counterAxis, nodeX, nodeY, barCount, elbow },
    seed,
  );

  // Clip-level safety fade so the card never pops on enter/exit.
  const env = interpolate(
    frame,
    [0, 12, SWISS_POSTER_DURATION - 12, SWISS_POSTER_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Snappy spring reveal, keyed off a per-element delay (Swiss motion: hard, fast).
  const reveal = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 140 } });

  const ramp = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Render a structural / elbow bar as a rotated div.
  const barStyle = (b: Bar, p: number): React.CSSProperties => ({
    position: "absolute",
    left: `${b.x}%`,
    top: `${b.y}%`,
    width: `${b.length}%`,
    height: b.thickness,
    backgroundColor: b.accent ? accentColor : inkColor,
    transform:
      b.origin === "left"
        ? `translateY(-50%) rotate(${b.angle}deg) scaleX(${p})`
        : `translate(-50%, -50%) rotate(${b.angle}deg) scaleX(${p})`,
    transformOrigin: b.origin === "left" ? "left center" : "center",
  });

  // A display word that reads ACROSS the node along the given axis angle.
  const axisWord = (
    text: string,
    axisAngle: number,
    color: string,
    delay: number,
  ): React.ReactNode => (
    <div
      style={{
        position: "absolute",
        left: `${arm.node.x}%`,
        top: `${arm.node.y}%`,
        transform: `translate(-50%, -50%) rotate(${axisAngle}deg)`,
        transformOrigin: "center",
        fontFamily: FONT_FAMILY,
        fontWeight: 800,
        fontSize: headlineSize,
        lineHeight: 0.86,
        letterSpacing: -4,
        color,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        ...wipeAlong(reveal(delay)),
      }}
    >
      {text}
    </div>
  );

  const marginX = width * 0.06;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: paperColor,
        fontFamily: FONT_FAMILY,
        color: inkColor,
        opacity: env,
        overflow: "hidden",
      }}
    >
      {/* Structural bars — the rotated grid, scaled in along their length. */}
      {arm.bars.map((b, i) => {
        const start = 6 + i * 2;
        return <div key={`bar-${i}`} style={barStyle(b, ramp(start, start + 16))} />;
      })}

      {/* Right-angle accent path — turns at the node. */}
      {arm.elbow.map((b, i) => (
        <div key={`elbow-${i}`} style={barStyle(b, reveal(8 + i * 4))} />
      ))}

      {/* Top kicker row: tracked label · rule · year marker. */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: marginX,
          right: marginX,
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <span
          style={{ fontSize: 20, fontWeight: 600, letterSpacing: 4, whiteSpace: "nowrap", opacity: ramp(8, 24) }}
        >
          {kicker}
        </span>
        <div style={{ flex: 1, height: 2, backgroundColor: inkColor, ...wipeAlong(reveal(2)) }} />
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, opacity: ramp(4, 18) }}>
          {year}
        </span>
      </div>

      {/* The two display words crossing at the node. */}
      {axisWord(headlineTop, arm.angle, inkColor, 6)}
      {counterAxis && axisWord(headlineBottom, arm.counterAngle, accentColor, 12)}

      {/* Rotated metadata column — reads along the primary axis, offset from the node. */}
      <div
        style={{
          position: "absolute",
          left: `${Math.max(8, arm.node.x - 30)}%`,
          top: `${Math.min(82, arm.node.y + 26)}%`,
          width: "22%",
          transform: `rotate(${arm.angle}deg)`,
          transformOrigin: "left center",
          opacity: ramp(30, 46),
        }}
      >
        {metaLines.map((text, i) => (
          <div key={i} style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.4 }}>
            {text}
          </div>
        ))}
      </div>

      {/* Footer label, set vertically up the right edge. */}
      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 80,
          transform: "rotate(-90deg)",
          transformOrigin: "right bottom",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 3,
          whiteSpace: "nowrap",
          opacity: ramp(40, 56),
        }}
      >
        {footer}
      </div>
    </AbsoluteFill>
  );
};
