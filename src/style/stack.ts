// ─────────────────────────────────────────────────────────────────────────────
// Style Stack — blend multiple StyleSpecs by weight into one resolved spec.
// Spec-level interpolation (per the locked decision): numbers weighted-average,
// colors mix, motifs union by (motif.weight × layer.weight), hard enums/fonts
// take the dominant layer. This is what makes "Swiss 70% / Japanese 30%" a real,
// generable identity — the thing that separates Aqua Studio from templates.
// ─────────────────────────────────────────────────────────────────────────────
import type { StyleSpec, MotifPreference } from "./types"
import { styles } from "./registry"

export interface StyleStackLayer {
  styleId: string
  weight: number
}
export interface StyleStack {
  layers: StyleStackLayer[]
}

const hexToRgb = (h: string): [number, number, number] | null => {
  let s = h.replace("#", "")
  if (s.length === 3) s = s.split("").map((c) => c + c).join("")
  if (!/^[0-9a-f]{6}$/i.test(s)) return null
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}
const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")

/** Resolve a stack of style ids+weights into a single blended StyleSpec. */
export function resolveStack(stack: StyleStack): StyleSpec {
  const layers = stack.layers
    .filter((l) => l.weight > 0 && styles.has(l.styleId))
    .map((l) => ({ style: styles.require(l.styleId), weight: l.weight }))
  if (layers.length === 0) return styles.require("default")
  if (layers.length === 1) return layers[0].style

  const total = layers.reduce((a, l) => a + l.weight, 0)
  const norm = layers.map((l) => ({ style: l.style, w: l.weight / total }))
  const dom = [...norm].sort((a, b) => b.w - a.w)[0].style

  const wavg = (pick: (s: StyleSpec) => number) => norm.reduce((a, l) => a + pick(l.style) * l.w, 0)
  const mix = (pick: (s: StyleSpec) => string): string => {
    const acc = [0, 0, 0]
    let wsum = 0
    for (const l of norm) {
      const rgb = hexToRgb(pick(l.style))
      if (!rgb) continue
      acc[0] += rgb[0] * l.w
      acc[1] += rgb[1] * l.w
      acc[2] += rgb[2] * l.w
      wsum += l.w
    }
    return wsum ? rgbToHex(acc[0] / wsum, acc[1] / wsum, acc[2] / wsum) : pick(dom)
  }

  // Motif union, weighted by motif weight × layer weight.
  const motifMap = new Map<string, number>()
  for (const l of norm)
    for (const m of l.style.visualLanguage.motifs)
      motifMap.set(m.id, (motifMap.get(m.id) ?? 0) + m.weight * l.w)
  const motifs: MotifPreference[] = [...motifMap.entries()]
    .filter(([, w]) => w > 0.08)
    .map(([id, weight]) => ({ id, weight: Number(weight.toFixed(3)) }))

  return {
    id: "blend:" + norm.map((l) => l.style.id).join("+"),
    label: norm.map((l) => `${l.style.label} ${Math.round(l.w * 100)}%`).join(" / "),
    typography: {
      ...dom.typography, // fonts / case / align / weights from the dominant layer
      tracking: wavg((s) => s.typography.tracking),
    },
    layout: { ...dom.layout, columns: Math.round(wavg((s) => s.layout.columns)) },
    spacing: {
      margin: wavg((s) => s.spacing.margin),
      rhythm: Math.round(wavg((s) => s.spacing.rhythm)),
      whitespace: dom.spacing.whitespace,
    },
    visualLanguage: {
      ...dom.visualLanguage,
      motifs,
      density: {
        min: Math.round(wavg((s) => s.visualLanguage.density.min)),
        max: Math.round(wavg((s) => s.visualLanguage.density.max)),
      },
    },
    color: {
      strategy: dom.color.strategy,
      background: mix((s) => (typeof s.color.background === "string" ? s.color.background : "#000000")),
      accent: mix((s) => s.color.accent),
      palette: [...new Set(norm.flatMap((l) => l.style.color.palette))],
    },
    texture: {
      surface: dom.texture.surface,
      intensity: wavg((s) => s.texture.intensity),
      vignette: dom.texture.vignette,
    },
    motion: {
      ...dom.motion,
      stagger: wavg((s) => s.motion.stagger),
      speed: wavg((s) => s.motion.speed),
    },
    camera: { move: dom.camera.move, amount: wavg((s) => s.camera.amount) },
    effects: dom.effects,
  }
}
