// ─────────────────────────────────────────────────────────────────────────────
// Motion Engine — pure, frame-driven helpers shared by the pattern field (and,
// in later phases, titles). Extracted from PatternField so motion is one place
// any style/effect can reuse. All helpers are deterministic given `frame`, so
// preview and MP4/alpha render stay frame-exact.
// ─────────────────────────────────────────────────────────────────────────────
import type { ClipSide } from "../lib/patterngen/engine"

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Directional clip-path reveal: p=0 fully hidden → p=1 fully shown. */
export const clipFor = (side: ClipSide, p: number): string => {
  const r = (1 - p) * 100
  switch (side) {
    case "left":
      return `inset(0 ${r}% 0 0)`
    case "right":
      return `inset(0 0 0 ${r}%)`
    case "top":
      return `inset(0 0 ${r}% 0)`
    case "bottom":
      return `inset(${r}% 0 0 0)`
  }
}

/**
 * Reveal progress for a staggered element: starts at `delay*spread` frames and
 * ramps 0→1 over `dur` frames. (Matches PatternField's original `prog`.)
 */
export const revealProgress = (
  f: number,
  delay: number,
  spread: number,
  dur: number,
): number => clamp01((f - delay * spread) / dur)
