// diagonalBars — the Swiss building block. Scatters solid bars across the frame
// at a few canonical angles (horizontal / vertical / ±diagonal) with seeded
// position, length and jitter, so every render is unique but unmistakably Swiss.
// Fully portable: any style/stack can reference it by id with a weight.
import { mulberry32 } from "../../lib/patterngen/engine"
import { motifRegistry } from "./registry"
import type { Motif, MotifElement } from "./types"
import type { ClipSide } from "../../lib/patterngen/engine"

const CANVAS_W = 1920
const CANVAS_H = 1080
// Swiss bars sit on a small set of angles; jitter keeps them from feeling rigid.
const ANGLES = [0, 90, 45, -45, 45, -45] // diagonals weighted higher

export const diagonalBars: Motif = (ctx, weight = 1) => {
  // Derive an independent stream from the seed so bars don't correlate with
  // any other motif sharing the same seed.
  const rand = mulberry32((ctx.seed ^ 0x9e3779b1) >>> 0)
  const count = Math.max(6, Math.round(ctx.density * 1.4 * weight))
  const color = ctx.colors[0] || "#ffffff"

  const els: MotifElement[] = []
  for (let i = 0; i < count; i++) {
    const angle = ANGLES[Math.floor(rand() * ANGLES.length)] + (rand() * 10 - 5)
    const len = 120 + rand() * 560
    const thick = 16 + Math.floor(rand() * 18)
    // Asymmetric bias: pull slightly toward the upper-left and lower-right, the
    // diagonal tension Swiss layouts trade on.
    const x = rand() * (CANVAS_W + 200) - 100
    const y = rand() * (CANVAS_H + 120) - 60
    const clipSide: ClipSide = angle < 0 ? "right" : angle >= 80 ? "top" : "left"
    els.push({
      kind: "bar",
      id: `bar_${i}`,
      rect: { x, y, w: len, h: thick },
      color,
      rotation: angle,
      clipSide,
      seedPhase: rand(),
    })
  }
  return els
}

motifRegistry.register("diagonalBars", diagonalBars)
