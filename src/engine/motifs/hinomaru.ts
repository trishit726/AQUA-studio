// hinomaru — the Japanese Editorial focal motif: a single large red disc (the
// rising-sun circle), with a seeded position/size so each render breathes
// differently. Portable across styles/stacks.
import { mulberry32 } from "../../lib/patterngen/engine"
import { motifRegistry } from "./registry"
import type { Motif, MotifElement } from "./types"

export const hinomaru: Motif = (ctx) => {
  const rand = mulberry32((ctx.seed ^ 0x06b79a11) >>> 0)
  const color = ctx.colors[0] || "#c8102e"
  const cx = 720 + (rand() * 2 - 1) * 90
  const cy = 430 + (rand() * 2 - 1) * 60
  const r = 300 + rand() * 50
  return [{ kind: "disc", id: "hinomaru", cx, cy, r, color, seedPhase: 0 }]
}

motifRegistry.register("hinomaru", hinomaru)
