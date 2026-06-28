// ─────────────────────────────────────────────────────────────────────────────
// "default" Style Pack — encodes Aqua Studio's CURRENT hardcoded look so the
// refactor has a parity anchor. Phase 1 will make PatternTitle read these values
// instead of inline constants; the output must stay pixel-identical.
//
// Values mirror, exactly:
//   - PatternTitle.tsx  (fonts: Anton; grain 0.1 + vignette; camera defaults)
//   - patternTitleDefaults (palette, accent #f74026, bg #2b2b2b, density/stagger)
//   - engine.ts         (GRID_SIZE=20 rhythm; the 16-shape vocabulary)
//   - PatternField.tsx  (clip-wipe reveal; spring damping 200)
//
// Per-scene props (accent, palette, density, …) become StyleOverrides on top of
// this base via the Phase-1 back-compat adapter — so editing a scene still works.
// ─────────────────────────────────────────────────────────────────────────────
import type { StyleSpec } from "../types"
import { styles } from "../registry"

const ANTON = { googleFont: "Anton", weights: ["400"], fallback: "Impact, sans-serif" }

export const DEFAULT_STYLE: StyleSpec = {
  id: "default",
  label: "Pattern (default)",

  typography: {
    headlineFont: ANTON,
    labelFont: ANTON,
    monoFont: undefined,
    case: "upper", // textTransform: uppercase on block + label
    weightScale: [400],
    hierarchy: [1, 0.23], // block 130 / label 30 ≈ 0.23
    tracking: 1, // block letterSpacing 1 (label uses 2 at render time)
    align: "flush-left",
  },

  layout: {
    strategy: "freeform", // titles placed by explicit (x,y) — current behaviour
    columns: 12, // unused by freeform; neutral default
    rotation: { enabled: false, range: [0, 0] },
    bias: "center",
  },

  spacing: {
    margin: 5, // TITLE_SAFE_PADDING "5%"
    rhythm: 20, // engine GRID_SIZE
    whitespace: "balanced",
  },

  visualLanguage: {
    geometry: "patterngen16", // the existing 16 shapes (primitive set)
    dominant: "", // "" = no glyph is weighted higher (uniform, as today)
    motifs: [{ id: "patterngen16", weight: 1 }], // today's scatter behaviour
    density: { min: 1, max: 20 }, // current density slider range
    motif: "none",
  },

  color: {
    strategy: "pairsFromPalette", // engine pairsForColor()
    background: "#2b2b2b", // bgColor default
    palette: ["#6fa5a9", "#93ab5a", "#cf9f4a", "#e0573a", "#000000", "#ffffff"],
    accent: "#f74026",
  },

  texture: {
    surface: "grain", // GrainOverlay
    intensity: 0.1,
    vignette: true,
  },

  motion: {
    easing: "spring(200)", // spring damping 200
    enter: "wipe", // titleAnim default
    stagger: 3,
    speed: 1,
    rhythm: "snappy",
  },

  camera: {
    move: "none",
    amount: 5,
  },

  effects: [
    { type: "scatter", enabled: true },
    {
      type: "flood",
      enabled: false, // intro "none" by default
      params: { style: "random", speed: 5, tile: 6, shapes: 5, persist: true, solid: false },
    },
  ],
}

styles.register(DEFAULT_STYLE.id, DEFAULT_STYLE)
