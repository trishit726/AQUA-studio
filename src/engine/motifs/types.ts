// ─────────────────────────────────────────────────────────────────────────────
// Motif system — higher-level, reusable, fully-portable building blocks.
//
// A Motif is a *design idea* (e.g. "diagonal bar cluster", "radar ring"), not a
// single glyph. It generates a set of drawable MotifElements within a context.
// Motifs compose the primitive glyphs (the 16 shapes) rather than replacing
// them, and any motif may be used by any style (portability) — a style only
// expresses *preference + weight*.
//
// MotifElement is the common, render-agnostic element model every motif emits,
// so the renderer can draw output from any motif uniformly.
// ─────────────────────────────────────────────────────────────────────────────
import type { Rect, ColorPair } from "../../style/types"
import type { AnimType, ClipSide, TitleRect } from "../../lib/patterngen/engine"

/** One drawable. A discriminated union so the renderer switches on `kind`. */
export type MotifElement =
  | {
      kind: "square"
      id: string
      rect: Rect
      color: string
      clipSide: ClipSide
      /** 0..1 deterministic phase driving stagger/reveal. */
      seedPhase: number
    }
  | {
      kind: "glyph"
      id: string
      glyph: AnimType
      rect: Rect
      colors: ColorPair
      clipSide: ClipSide
      seedPhase: number
    }
  | {
      kind: "dot"
      id: string
      x: number
      y: number
      color: string
      blinkPhase: number
      blinkSpeed: number
    }
  | {
      // A rotated solid bar — the Swiss building block. Wipes in along its length.
      kind: "bar"
      id: string
      rect: Rect
      color: string
      rotation: number // degrees
      clipSide: ClipSide
      seedPhase: number
    }
  | {
      // A filled circle — the Japanese hinomaru / stamp. Scales in.
      kind: "disc"
      id: string
      cx: number
      cy: number
      r: number
      color: string
      seedPhase: number
    }
  | {
      // A stroked ring — the Cyber HUD radar. Scales in.
      kind: "ring"
      id: string
      cx: number
      cy: number
      r: number
      color: string
      thickness: number
      seedPhase: number
    }

/** Everything a motif needs to generate within a composition. */
export interface MotifContext {
  titles: TitleRect[]
  colors: string[]
  density: number
  proximity: number
  seed: number
  enabledAnims: AnimType[]
}

/** A motif: pure, deterministic given the context + seed. `weight` lets a motif
 *  scale its contribution when blended in a Style Stack (default 1). */
export type Motif = (ctx: MotifContext, weight?: number) => MotifElement[]
