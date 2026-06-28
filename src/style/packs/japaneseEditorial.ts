// "japaneseEditorial" — vertical CJK type with ruby, a dominant hinomaru circle,
// duotone red/black, Mincho serif, generous margins, slow refined motion.
import type { StyleSpec } from "../types"
import { styles } from "../registry"

const MINCHO = { googleFont: "ShipporiMincho", weights: ["500", "700"], fallback: "serif" }
const INTER = { googleFont: "Inter", weights: ["400", "500"], fallback: "sans-serif" }

export const JAPANESE_EDITORIAL_STYLE: StyleSpec = {
  id: "japaneseEditorial",
  label: "Japanese Editorial",
  typography: {
    headlineFont: MINCHO,
    labelFont: INTER,
    case: "as-is",
    weightScale: [500, 700],
    hierarchy: [1, 0.22],
    tracking: 4,
    align: "vertical-rl",
  },
  layout: { strategy: "vertical", columns: 8, bias: "center" },
  spacing: { margin: 8, rhythm: 20, whitespace: "generous" },
  visualLanguage: {
    geometry: "none",
    dominant: "disc",
    motifs: [{ id: "hinomaru", weight: 1 }],
    density: { min: 0, max: 1 },
    motif: "hinomaru",
  },
  color: {
    strategy: "duotone",
    background: "#f3f0ea",
    palette: ["#c8102e", "#1a1a1a", "#f3f0ea"],
    accent: "#c8102e",
  },
  texture: { surface: "none", intensity: 0.05, vignette: false },
  motion: { easing: "outExpo", enter: "fade", stagger: 3, speed: 0.9, rhythm: "smooth" },
  camera: { move: "none", amount: 0 },
  effects: [],
}

styles.register(JAPANESE_EDITORIAL_STYLE.id, JAPANESE_EDITORIAL_STYLE)
