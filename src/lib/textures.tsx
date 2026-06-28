// ────────────────────────────────────────────────────────────────────────────
// SHARED BACKGROUND + TEXTURE LAYER (the "connective tissue").
//
//   <Backdrop variant="painterly" />   — a painterly/studio/liminal background
//   <GrainOverlay name="x" />          — film grain + mottle + vignette, on top
//
// Drop <GrainOverlay> as the LAST child of any composition to unify the look.
// ────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// The colour scheme eyedropped from his video (see DESIGN.md). Use these
// everywhere so the whole project stays in his palette.
export const PALETTE = {
  red: "#f74026", // signature vermilion
  cream: "#dbd7c7", // studio space
  plane: "#eae6dc", // floating poster surface
  ink: "#111111", // type / blocks
  sage: "#5d7a5c",
  ochre: "#c79a4a",
  rust: "#8a5340",
  slate: "#5f7e96",
} as const;

export type BackdropVariant =
  | "studio" // clean warm cream (the "TITLE ENGINE" space)
  | "paper" // lighter washi off-white
  | "painterly" // muted multi-colour watercolour washes
  | "dusk" // moody dark painterly
  | "washi" // soft minimal warm beige
  | "ink"; // near-black with faint coloured haze

type Preset = { base: string; blobs: string[]; dark: boolean };

export const BACKDROPS: Record<BackdropVariant, Preset> = {
  studio: { base: "#dbd7c7", blobs: ["#e6e1d2", "#cfcaba", "#e9e4d6"], dark: false },
  paper: { base: "#e8e4da", blobs: ["#f1ede3", "#dcd7ca", "#efebe1"], dark: false },
  painterly: {
    base: "#b7b1a4",
    blobs: ["#5d7a5c", "#5f7e96", "#c79a4a", "#d9d2c2", "#8a5340", "#3f3a32"],
    dark: false,
  },
  dusk: {
    base: "#2c2f33",
    blobs: ["#3c5a52", "#7a3f30", "#46505e", "#1f2024", "#6b5a3a"],
    dark: true,
  },
  washi: { base: "#e3dccb", blobs: ["#ece6d6", "#d6cfba", "#cabfa3"], dark: false },
  ink: { base: "#15140f", blobs: ["#3a2f22", "#22303a", "#4a1f17", "#0c0b08"], dark: true },
};

// Deterministic blob placement (no Math.random — renders must be stable).
const POSITIONS = [
  ["26%", "28%"],
  ["74%", "40%"],
  ["48%", "74%"],
  ["62%", "18%"],
  ["18%", "80%"],
  ["82%", "76%"],
];
const SIZES = [1100, 1000, 900, 700, 820, 720];

export const Backdrop: React.FC<{ variant: BackdropVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = BACKDROPS[variant];
  const drift = Math.sin((frame / fps) * 0.4) * 16;

  return (
    <AbsoluteFill style={{ backgroundColor: p.base, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "blur(5px)" }}>
        {p.blobs.map((c, i) => {
          const [left, top] = POSITIONS[i % POSITIONS.length];
          const size = SIZES[i % SIZES.length];
          const dx = drift * (i % 2 === 0 ? 1 : -1) * (0.4 + (i % 3) * 0.3);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left,
                top,
                width: size,
                height: size,
                marginLeft: -size / 2 + dx,
                marginTop: -size / 2,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${c} 0%, transparent 65%)`,
                opacity: p.dark ? 0.85 : 0.7,
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// PaintedImage — takes a REAL photo and "merges the shades within it": a
// watercolor/oil bleed made by displacing the image with turbulence noise, then
// blurring and grading. This is how halfof8's painterly backgrounds actually
// work (a photo run through a painterly filter), not procedural blobs.
//
//   <PaintedImage src={staticFile("images/scene.jpg")} />
export const PaintedImage: React.FC<{
  src: string;
  name?: string;
  strength?: number; // how far shades bleed/merge (displacement scale)
  blur?: number;
  saturate?: number;
  kenBurns?: boolean; // slow zoom so the painting breathes
  grade?: boolean; // pull the photo into his muted palette
  tint?: string; // grade target (warm cream/earthy by default)
  tintStrength?: number;
}> = ({
  src,
  name = "p",
  strength = 75,
  blur = 2.6,
  saturate = 0.5,
  kenBurns = true,
  grade = true,
  tint = "#c8b283",
  tintStrength = 0.32,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fid = `paint-${name}`;
  const zoom = kenBurns ? interpolate(frame, [0, durationInFrames], [1.06, 1.16]) : 1.06;
  // ~7 discrete levels per channel → flattens detail into watercolour shade regions.
  const levels = "0 0.16 0.33 0.5 0.66 0.83 1";

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id={fid}>
          {/* 1) soften detail into shades  2) smear them with big low-freq noise
              3) posterize so shades MERGE into flat watercolour regions */}
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves={3} seed={7} result="n" />
          <feDisplacementMap in="b" in2="n" scale={strength} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feComponentTransfer in="d">
            <feFuncR type="discrete" tableValues={levels} />
            <feFuncG type="discrete" tableValues={levels} />
            <feFuncB type="discrete" tableValues={levels} />
          </feComponentTransfer>
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          filter: `url(#${fid}) saturate(${saturate}) contrast(1.03) sepia(${grade ? 0.28 : 0})`,
          transform: `scale(${zoom})`,
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>

      {/* grade toward his muted cream/earthy palette */}
      {grade && (
        <>
          {/* nudge hues warm/earthy */}
          <AbsoluteFill style={{ backgroundColor: "#9c8557", mixBlendMode: "color", opacity: 0.22 }} />
          <AbsoluteFill style={{ backgroundColor: tint, mixBlendMode: "soft-light", opacity: tintStrength }} />
          <AbsoluteFill style={{ backgroundColor: "#2a261f", mixBlendMode: "soft-light", opacity: 0.16 }} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const GrainOverlay: React.FC<{
  name?: string;
  intensity?: number;
  mottle?: number;
  vignette?: boolean;
  dark?: boolean;
}> = ({ name = "g", intensity = 0.12, mottle = 0.3, vignette = true, dark = false }) => {
  const gid = `grain-${name}`;
  const mid = `mottle-${name}`;
  return (
    <>
      <svg style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none" }}>
        <filter id={mid}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <filter id={gid}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        {mottle > 0 && (
          <rect width="100%" height="100%" filter={`url(#${mid})`} opacity={mottle} style={{ mixBlendMode: "overlay" }} />
        )}
        <rect width="100%" height="100%" filter={`url(#${gid})`} opacity={intensity} style={{ mixBlendMode: dark ? "screen" : "multiply" }} />
      </svg>
      {vignette && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: `radial-gradient(circle at center, transparent 45%, rgba(0,0,0,${dark ? 0.5 : 0.26}) 100%)`,
          }}
        />
      )}
    </>
  );
};
