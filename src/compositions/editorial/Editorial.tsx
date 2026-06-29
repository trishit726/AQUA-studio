// EditorialMotion — ONE parameterised composition that emits many on-brand
// variations of a single fixed style: a monochrome Swiss editorial motion piece.
//
// The style is split into INVARIANTS (hardcoded here — the grayscale palette, the
// scaffold chrome, the motion grammar, the seamless loop) and VARIABLES (the props
// below — motif, copy, layout, motion speeds, density, optional accent, seed). N
// configs ⇒ N variations that stay unmistakably same-style.
//
// Layers: (1) Scaffold chrome  (2) Motif slot  (3) Motion  (4) Text. Phase 1 wires
// the static scaffold + a resting eye; motion + the motif library land in later
// phases. The prop schema is intentionally clean so app/api/generate/route.ts could
// later target it the way it targets PatternTitle — that route is NOT built here.
import React from "react";
import {
  AbsoluteFill,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { FONT_FAMILY } from "../../lib/fonts";
import { seconds } from "../../config";
import { Scaffold } from "./scaffold";
import { EyeMotif } from "./motifs/eye";

// ── INVARIANT palette: grayscale only (paper / ink / one neutral mid). ──────────
const PAPER = "#111113";
const INK = "#ECEBE4";
const MID = "#74747A";

export const EDITORIAL_DURATION = seconds(6);

export const editorialSchema = z.object({
  // Which central motif fills the slot.
  motif: z.enum(["eye", "globe", "target", "aperture"]),
  // ── Copy (all text comes from here; nothing is hardcoded) ──────────────────
  headline: z.string(),
  tagline: z.string(),
  ringText: z.string(), // text on the circular path around the motif
  cornerLeft: z.string(), // split numeral, one corner
  cornerRight: z.string(), // split numeral, opposite corner
  logoText: z.string(), // centred wordmark
  // ── Layout (placement only — never changes the chrome) ─────────────────────
  layout: z.object({
    motifSlot: z.enum(["centered", "offsetLeft"]),
    header: z.enum(["top", "bottom"]),
  }),
  // ── Motion (which primitives are active + speed/direction) ─────────────────
  // ringSpin / globeSpin are signed TURNS over the whole loop (rounded to whole
  // turns for a seamless loop); 0 = off. motifTravel is gaze amplitude 0..1.
  motion: z.object({
    ringSpin: z.number().min(-4).max(4),
    motifTravel: z.number().min(0).max(1),
    globeSpin: z.number().min(-4).max(4),
  }),
  // How much optional scaffold decoration shows (0..1).
  ornamentDensity: z.number().min(0).max(1),
  // Optional single accent colour. "" = pure grayscale (the default).
  accent: z.union([zColor(), z.literal("")]),
  // Deterministically resolves any unspecified variable.
  seed: z.number().int(),
  // Clip length in seconds (drives durationInFrames via calculateMetadata).
  loopSeconds: z.number().min(2).max(20),
});

export type EditorialProps = z.infer<typeof editorialSchema>;

export const editorialDefaults: EditorialProps = {
  motif: "eye",
  headline: "WAYS\nOF SEEING",
  tagline: "An editorial system that watches the page back — one style, many issues.",
  ringText: "AQUA STUDIO · EDITORIAL SYSTEM · ",
  cornerLeft: "01",
  cornerRight: "26",
  logoText: "STUDIO",
  layout: { motifSlot: "centered", header: "top" },
  motion: { ringSpin: 1, motifTravel: 0.6, globeSpin: 1 },
  ornamentDensity: 0.6,
  accent: "",
  seed: 7,
  loopSeconds: 6,
};

// Duration follows loopSeconds so the loop math always closes on the last frame.
export const calculateEditorialMetadata: CalculateMetadataFunction<
  EditorialProps
> = ({ props }) => ({
  durationInFrames: seconds(props.loopSeconds),
});

export const Editorial: React.FC<EditorialProps> = ({
  motif,
  headline,
  tagline,
  cornerLeft,
  cornerRight,
  logoText,
  layout,
  ornamentDensity,
  accent,
}) => {
  const { width: w, height: h } = useVideoConfig();

  // Motif slot centre.
  const slot =
    layout.motifSlot === "offsetLeft"
      ? { cx: Math.round(w * 0.4), cy: Math.round(h * 0.46) }
      : { cx: Math.round(w * 0.5), cy: Math.round(h * 0.46) };
  const eyeW = Math.round(w * 0.23);
  const eyeH = Math.round(w * 0.135);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PAPER,
        fontFamily: FONT_FAMILY,
        color: INK,
        overflow: "hidden",
      }}
    >
      {/* (2) Motif slot — Phase 1: resting eye, no motion. */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {motif === "eye" && (
          <EyeMotif
            cx={slot.cx}
            cy={slot.cy}
            w={eyeW}
            h={eyeH}
            ink={INK}
            mid={MID}
            accent={accent}
            clipId="editorial-eye-clip"
          />
        )}
      </svg>

      {/* (1)+(4) Scaffold chrome + text. */}
      <Scaffold
        w={w}
        h={h}
        ink={INK}
        mid={MID}
        paper={PAPER}
        accent={accent}
        headline={headline}
        tagline={tagline}
        cornerLeft={cornerLeft}
        cornerRight={cornerRight}
        logoText={logoText}
        header={layout.header}
        ornamentDensity={ornamentDensity}
      />
    </AbsoluteFill>
  );
};
