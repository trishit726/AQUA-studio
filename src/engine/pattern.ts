// ─────────────────────────────────────────────────────────────────────────────
// Pattern Generator — resolves a style's preferred motifs (by id + weight) to
// implementations and runs them over a context, concatenating their elements.
//
// This is the seam that makes geometry style-driven: the default style resolves
// to the single `patterngen16` motif (today's scatter, pixel-identical). Other
// styles list other motifs; a Style Stack blends motifs from several styles —
// all without the renderer knowing any style id.
// ─────────────────────────────────────────────────────────────────────────────
import type { MotifPreference } from "../style/types"
import { motifRegistry } from "./motifs/registry"
import type { MotifContext, MotifElement } from "./motifs/types"
import "./motifs/patterngen16" // register the legacy scatter motif
import "./motifs/diagonalBars" // register the Swiss bar motif
import "./motifs/radarRing" // register the Cyber HUD radar motif
import "./motifs/hinomaru" // register the Japanese disc motif

/** Default when a caller supplies no motifs — preserves current behaviour. */
export const DEFAULT_MOTIFS: MotifPreference[] = [{ id: "patterngen16", weight: 1 }]

export function generatePattern(
  ctx: MotifContext,
  motifs: MotifPreference[] = DEFAULT_MOTIFS,
): MotifElement[] {
  const out: MotifElement[] = []
  for (const pref of motifs) {
    const motif = motifRegistry.get(pref.id)
    if (!motif) {
      console.warn(`[pattern] no motif registered for "${pref.id}" — skipping`)
      continue
    }
    out.push(...motif(ctx, pref.weight))
  }
  return out
}
