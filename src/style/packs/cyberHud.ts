// "cyberHud" — glassmorphism / holographic chrome. Dark ground, an iridescent
// glass torus with chromatic aberration and volumetric glow, bold grotesque type
// interacting with the form, small mono technical labels. (Grammar from
// NEW RFERNCE/cyber hub: glass material, iridescent palette, glossy finish.)
import type { StyleSpec } from "../types"
import { styles } from "../registry"

const SPACE_GROTESK = { googleFont: "SpaceGrotesk", weights: ["400", "500", "700"], fallback: "sans-serif" }
const SPACE_MONO = { googleFont: "SpaceMono", weights: ["400", "700"], fallback: "monospace" }

export const CYBER_HUD_STYLE: StyleSpec = {
  id: "cyberHud",
  label: "Glass / Holographic",
  typography: {
    headlineFont: SPACE_GROTESK,
    labelFont: SPACE_MONO,
    monoFont: SPACE_MONO,
    case: "upper",
    weightScale: [400, 500, 700],
    hierarchy: [1, 0.14],
    tracking: 2,
    align: "centered",
  },
  layout: { strategy: "radial", columns: 12, bias: "center" },
  spacing: { margin: 6, rhythm: 20, whitespace: "balanced" },
  visualLanguage: {
    geometry: "none",
    dominant: "glass",
    motifs: [], // the glass form is rendered in the composition
    density: { min: 0, max: 1 },
    motif: "glass",
  },
  color: {
    strategy: "neonOnDark",
    background: "#050507",
    // iridescent holographic palette
    palette: ["#ff3df2", "#7a5cff", "#19e0ff", "#6fffd2", "#ffe24d", "#ff8a3d"],
    accent: "#19e0ff",
  },
  texture: { surface: "glass", intensity: 0.1, vignette: true },
  motion: { easing: "outExpo", enter: "fade", stagger: 2, speed: 1, rhythm: "smooth" },
  camera: { move: "none", amount: 0 },
  effects: [],
}

styles.register(CYBER_HUD_STYLE.id, CYBER_HUD_STYLE)
