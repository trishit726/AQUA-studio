// ─────────────────────────────────────────────────────────────────────────────
// Layout Engine — resolves a style's layout strategy to anchor slots for text
// roles. Strategies live in a registry (id → fn), so a style references one by
// id and composeLayout() never branches on a style. Seeded jitter keeps every
// render unique within the strategy's grammar (asymmetric ≠ template).
// ─────────────────────────────────────────────────────────────────────────────
import { Registry } from "../../style/registry"
import { mulberry32 } from "../../lib/patterngen/engine"
import type { LayoutStrategy, LayoutMap } from "./types"

export * from "./types"

export const layoutStrategyRegistry = new Registry<LayoutStrategy>("layout strategy")

const jitter = (seed: number) => {
  const rand = mulberry32((seed ^ 0x2545f491) >>> 0)
  return (range: number) => (rand() * 2 - 1) * range
}

// Swiss: huge headline top-left, counter-anchored secondary lower-right, small
// meta + caption stacked upper-left. Diagonal tension.
const asymmetric: LayoutStrategy = (_s, seed) => {
  const j = jitter(seed)
  return {
    headline: { x: 5 + j(1.5), y: 13 + j(2.5), align: "left" },
    secondary: { x: 44 + j(3), y: 50 + j(3), align: "left" },
    meta: { x: 6 + j(1.5), y: 36 + j(1.5), align: "left" },
    caption: { x: 6.5 + j(1), y: 52 + j(1.5), align: "left" },
  }
}

// Brutalist: giant headline anchored low-left, micro metadata pinned to the
// top and bottom edges. Maximal whitespace above the headline.
const editorial: LayoutStrategy = (_s, seed) => {
  const j = jitter(seed)
  return {
    headline: { x: 5, y: 60 + j(3), align: "left" },
    meta: { x: 5, y: 7 + j(1), align: "left" },
    caption: { x: 5, y: 91 + j(0.5), align: "left" },
    secondary: { x: 70 + j(2), y: 7 + j(1), align: "right" },
  }
}

// Cyber HUD: centered focal headline with a subtitle beneath; readouts pinned
// to the corners.
const radial: LayoutStrategy = (_s, seed) => {
  const j = jitter(seed)
  return {
    headline: { x: 50, y: 46 + j(2), align: "center" },
    secondary: { x: 50, y: 58 + j(1.5), align: "center" },
    meta: { x: 7, y: 88 + j(1), align: "left" },
    caption: { x: 93, y: 88 + j(1), align: "right" },
  }
}

// Japanese Editorial: vertical headline column slightly right of centre, latin
// footer centred at the bottom. (The composition handles writing-mode.)
const vertical: LayoutStrategy = (_s, seed) => {
  const j = jitter(seed)
  return {
    headline: { x: 56 + j(1.5), y: 30 + j(2), align: "center" },
    caption: { x: 40 + j(1.5), y: 34 + j(2), align: "center" },
    meta: { x: 50, y: 90 + j(0.5), align: "center" },
  }
}

// Default / freeform: centred single focal (the current PatternTitle leaves
// placement to explicit per-title coordinates, so this is only a fallback).
const freeform: LayoutStrategy = () => ({
  headline: { x: 50, y: 50, align: "center" },
})

layoutStrategyRegistry.register("asymmetric", asymmetric)
layoutStrategyRegistry.register("editorial", editorial)
layoutStrategyRegistry.register("radial", radial)
layoutStrategyRegistry.register("vertical", vertical)
layoutStrategyRegistry.register("freeform", freeform)

/** Resolve a style's layout strategy and produce its anchor map. */
export function composeLayout(
  style: import("../../style/types").StyleSpec,
  seed: number,
): LayoutMap {
  const strat =
    layoutStrategyRegistry.get(style.layout.strategy) ??
    layoutStrategyRegistry.require("freeform")
  return strat(style, seed)
}
