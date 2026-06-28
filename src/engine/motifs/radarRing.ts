// radarRing — the Cyber HUD building block: concentric stroked rings, a
// crosshair, tick marks around the rim, and a few pulsing "blips". Centered with
// seeded offset. Portable: usable by any style/stack.
import { mulberry32 } from "../../lib/patterngen/engine"
import { motifRegistry } from "./registry"
import type { ClipSide } from "../../lib/patterngen/engine"
import type { Motif, MotifElement } from "./types"

export const radarRing: Motif = (ctx, weight = 1) => {
  const rand = mulberry32((ctx.seed ^ 0x7f4a7c15) >>> 0)
  const color = ctx.colors[0] || "#19e0ff"
  const cx = 960 + (rand() * 2 - 1) * 150
  const cy = 520 + (rand() * 2 - 1) * 110
  const rings = 4
  const outer = 110 + (rings - 1) * 135

  const els: MotifElement[] = []
  for (let i = 0; i < rings; i++) {
    els.push({
      kind: "ring",
      id: `ring_${i}`,
      cx,
      cy,
      r: 110 + i * 135,
      color,
      thickness: i === rings - 1 ? 1 : 2,
      seedPhase: i * 0.12,
    })
  }

  // Crosshair through the centre.
  els.push({ kind: "bar", id: "cross_h", rect: { x: cx - outer, y: cy - 1, w: outer * 2, h: 2 }, color, rotation: 0, clipSide: "left", seedPhase: 0.4 })
  els.push({ kind: "bar", id: "cross_v", rect: { x: cx - 1, y: cy - outer, w: 2, h: outer * 2 }, color, rotation: 0, clipSide: "top", seedPhase: 0.45 })

  // Tick marks around the rim.
  const ticks = 24
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2
    const len = i % 6 === 0 ? 24 : 11
    const tx = cx + Math.cos(a) * (outer - len)
    const ty = cy + Math.sin(a) * (outer - len)
    const clipSide: ClipSide = "left"
    els.push({ kind: "bar", id: `tick_${i}`, rect: { x: tx, y: ty, w: len, h: 2 }, color, rotation: (a * 180) / Math.PI, clipSide, seedPhase: 0.5 + (i / ticks) * 0.3 })
  }

  // Pulsing blips inside the field.
  const blips = Math.max(3, Math.round(6 * weight))
  for (let i = 0; i < blips; i++) {
    const a = rand() * Math.PI * 2
    const rr = 50 + rand() * (outer - 70)
    els.push({ kind: "dot", id: `blip_${i}`, x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, color, blinkPhase: rand(), blinkSpeed: 0.2 + rand() * 0.3 })
  }

  return els
}

motifRegistry.register("radarRing", radarRing)
