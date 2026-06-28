// ─────────────────────────────────────────────────────────────────────────────
// "swiss" Style Pack — International Typographic / Swiss grammar, compiled to a
// StyleSpec. Grammar extracted from NEW RFERNCE/swiss (rules, not pixels):
//   huge lowercase grotesque · flush-left · asymmetric diagonal tension ·
//   rotated white bars as the only decoration · hot red ground · max contrast ·
//   snappy clip reveals · no texture.
// ─────────────────────────────────────────────────────────────────────────────
import type { StyleSpec } from "../types"
import { styles } from "../registry"

const ARCHIVO_BLACK = { googleFont: "ArchivoBlack", weights: ["400"], fallback: "Arial Black, sans-serif" }
const INTER = { googleFont: "Inter", weights: ["400", "700"], fallback: "Helvetica, Arial, sans-serif" }

export const SWISS_STYLE: StyleSpec = {
  id: "swiss",
  label: "Swiss Editorial",

  typography: {
    headlineFont: ARCHIVO_BLACK,
    labelFont: INTER,
    case: "lower",
    weightScale: [400, 700],
    hierarchy: [1, 0.12], // huge headline → tiny labels
    tracking: -3, // tight grotesque
    align: "flush-left",
  },

  layout: {
    strategy: "asymmetric",
    columns: 12,
    rotation: { enabled: true, range: [-12, 12] },
    bias: "corner-anchored",
  },

  spacing: {
    margin: 6,
    rhythm: 20,
    whitespace: "generous",
  },

  visualLanguage: {
    geometry: "swissBars",
    dominant: "bar",
    motifs: [{ id: "diagonalBars", weight: 1 }],
    density: { min: 8, max: 18 },
    motif: "diagonalAxis",
  },

  color: {
    strategy: "monochrome",
    background: "#e2231a", // Swiss red
    palette: ["#e2231a", "#ffffff", "#111111"],
    accent: "#111111",
  },

  texture: {
    surface: "none",
    intensity: 0,
    vignette: false,
  },

  motion: {
    easing: "spring(200)",
    enter: "wipe",
    stagger: 2,
    speed: 1.2,
    rhythm: "snappy",
  },

  camera: { move: "none", amount: 0 },

  effects: [{ type: "scatter", enabled: true }],
}

styles.register(SWISS_STYLE.id, SWISS_STYLE)
