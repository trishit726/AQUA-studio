// patterngen16 — the legacy scatter motif. Wraps the existing, deterministic
// generatePlacement() and adapts its {patterns, squares, dots} output to the
// common MotifElement model. This is the PARITY ANCHOR: the default style's
// only motif, producing today's exact output.
//
// Emission order (squares → glyphs → dots) preserves the original z-order.
import { generatePlacement } from "../../lib/patterngen/engine"
import { motifRegistry } from "./registry"
import type { Motif, MotifElement } from "./types"

export const patterngen16: Motif = (ctx) => {
  const place = generatePlacement(
    ctx.titles,
    ctx.colors,
    ctx.density,
    ctx.proximity,
    ctx.seed,
    ctx.enabledAnims,
  )

  const els: MotifElement[] = []
  for (const s of place.squares) {
    els.push({
      kind: "square",
      id: s.id,
      rect: { x: s.x, y: s.y, w: s.size, h: s.size },
      color: s.color,
      clipSide: s.clipSide,
      seedPhase: s.animDelay,
    })
  }
  for (const p of place.patterns) {
    els.push({
      kind: "glyph",
      id: p.id,
      glyph: p.anim,
      rect: { x: p.x, y: p.y, w: p.size, h: p.size },
      colors: p.colors,
      clipSide: p.clipSide,
      seedPhase: p.animDelay,
    })
  }
  for (const d of place.dots) {
    els.push({
      kind: "dot",
      id: d.id,
      x: d.x,
      y: d.y,
      color: d.color,
      blinkPhase: d.blinkPhase,
      blinkSpeed: d.blinkSpeed,
    })
  }
  return els
}

motifRegistry.register("patterngen16", patterngen16)
