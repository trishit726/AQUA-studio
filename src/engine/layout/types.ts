// ─────────────────────────────────────────────────────────────────────────────
// Layout Engine types. A layout STRATEGY turns a StyleSpec (+ seed) into anchor
// slots for the text roles. Grid / radial / editorial / asymmetric / vertical
// are implementations of the layout grammar (flow, anchors, alignment, reading
// direction) — not the vocabulary itself. Positions are in % of the frame so
// they're resolution-independent.
// ─────────────────────────────────────────────────────────────────────────────
import type { StyleSpec } from "../../style/types"

export type Role = "headline" | "secondary" | "meta" | "caption"

export interface Anchor {
  x: number // 0..100 (% of width)
  y: number // 0..100 (% of height)
  align: "left" | "center" | "right"
}

export type LayoutMap = Partial<Record<Role, Anchor>>

/** A layout strategy: deterministic given the style + seed. */
export type LayoutStrategy = (style: StyleSpec, seed: number) => LayoutMap
