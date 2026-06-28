// ─────────────────────────────────────────────────────────────────────────────
// Armature Engine types. An ARMATURE is the geometric skeleton behind the
// International-Typographic ("Swiss") posters: a small set of oriented axes that
// cross at a node, with type, bars, and fills all snapping to those axes.
//
// This is a richer layer than the upright-anchor Layout Engine — every element
// here can carry an angle, so the plane can be divided diagonally and type can
// run along an axis instead of sitting flat. Positions are in % of the frame so
// they stay resolution-independent.
// ─────────────────────────────────────────────────────────────────────────────

export type ArmatureMode = "asymmetricCross";

/** A decorative stroke that runs along (a parallel of) one of the axes. */
export interface Bar {
  x: number; // % of width  — anchor point
  y: number; // % of height — anchor point
  length: number; // % of width
  thickness: number; // px
  angle: number; // deg
  accent: boolean; // draw in the accent colour rather than ink
  origin: "center" | "left"; // transform-origin: bars pivot at centre, elbows at the node
}

/** A point where axes cross — the pivot the headline words read across. */
export interface ArmatureNode {
  x: number; // %
  y: number; // %
}

export interface Armature {
  mode: ArmatureMode;
  angle: number; // primary axis angle (deg)
  counterAngle: number; // counter axis angle (deg) — primary + 90
  node: ArmatureNode; // the crossing point
  bars: Bar[]; // scattered structural strokes
  elbow: Bar[]; // 0 or 2 accent segments forming a right-angle path through the node
}

export interface ArmatureOptions {
  angle: number; // requested primary axis angle
  counterAxis: boolean; // emit the perpendicular counter axis (the "cross")
  nodeX: number; // 0..100 — crossing node X
  nodeY: number; // 0..100 — crossing node Y
  barCount: number; // number of scattered structural bars
  elbow: boolean; // emit the right-angle accent path
}
