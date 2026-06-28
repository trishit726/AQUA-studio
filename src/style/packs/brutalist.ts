// "brutalist" — raw concrete editorial. Giant restrained headline vs micro mono
// metadata pinned to the edges; monochrome; huge negative space; minimal motion.
import type { StyleSpec } from "../types"
import { styles } from "../registry"

const INTER = { googleFont: "Inter", weights: ["400", "500", "700"], fallback: "Helvetica, Arial, sans-serif" }
const SPACE_MONO = { googleFont: "SpaceMono", weights: ["400", "700"], fallback: "monospace" }

export const BRUTALIST_STYLE: StyleSpec = {
  id: "brutalist",
  label: "Brutalist",
  typography: {
    headlineFont: INTER,
    labelFont: SPACE_MONO,
    monoFont: SPACE_MONO,
    case: "as-is",
    weightScale: [400, 500, 700],
    hierarchy: [1, 0.06],
    tracking: -3,
    align: "flush-left",
  },
  layout: { strategy: "editorial", columns: 12, bias: "corner-anchored" },
  spacing: { margin: 6, rhythm: 24, whitespace: "generous" },
  visualLanguage: { geometry: "none", dominant: "", motifs: [], density: { min: 0, max: 2 } },
  color: {
    strategy: "monochrome",
    background: "#dedbd3", // raw concrete
    palette: ["#dedbd3", "#141414", "#8a8780"],
    accent: "#141414",
  },
  texture: { surface: "paper", intensity: 0.14, vignette: false },
  motion: { easing: "inOutCubic", enter: "fade", stagger: 1, speed: 1, rhythm: "mechanical" },
  camera: { move: "none", amount: 0 },
  effects: [],
}

styles.register(BRUTALIST_STYLE.id, BRUTALIST_STYLE)
