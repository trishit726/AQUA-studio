// ─────────────────────────────────────────────────────────────────────────────
// Armature Engine — composeArmature() turns a few style params + a seed into the
// geometric skeleton of an International-Typographic poster. The "asymmetricCross"
// mode is the workhorse: one dominant diagonal axis + a perpendicular counter
// axis crossing at an off-centre node, plus a scatter of parallel structural bars
// and an optional right-angle accent path through the node.
//
// Everything is seeded, so the same params yield genuinely different — yet
// unmistakably Swiss — posters. The output is consumed by SwissPoster.tsx.
// ─────────────────────────────────────────────────────────────────────────────
import { mulberry32 } from "../../lib/patterngen/engine";
import type { Armature, ArmatureOptions, Bar } from "./types";

export * from "./types";

/** Right-angle accent path through the node: comes in along the counter axis,
 *  turns onto the primary axis. Both segments pivot at the node (origin "left"). */
const buildElbow = (
  node: { x: number; y: number },
  angle: number,
  counterAngle: number,
  reach: number,
): Bar[] => [
  // incoming leg, along the counter axis (pointing back, hence +180)
  { x: node.x, y: node.y, length: reach, thickness: 8, angle: counterAngle + 180, accent: true, origin: "left" },
  // outgoing leg, along the primary axis
  { x: node.x, y: node.y, length: reach * 1.35, thickness: 8, angle, accent: true, origin: "left" },
];

export function composeArmature(opts: ArmatureOptions, seed: number): Armature {
  const rand = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const j = (range: number) => (rand() * 2 - 1) * range;

  // Primary axis with a touch of seeded wobble; counter axis is perpendicular.
  const angle = opts.angle + j(2.5);
  const counterAngle = angle + 90;
  const node = {
    x: Math.max(20, Math.min(80, opts.nodeX + j(3))),
    y: Math.max(20, Math.min(80, opts.nodeY + j(3))),
  };

  // Scatter structural bars onto parallels of the two axes. Each bar rides
  // either the primary or (when present) the counter axis, with small wobble.
  const bars: Bar[] = [];
  for (let i = 0; i < opts.barCount; i++) {
    const onCounter = opts.counterAxis && rand() > 0.5;
    const base = onCounter ? counterAngle : angle;
    bars.push({
      x: 8 + rand() * 84,
      y: 8 + rand() * 84,
      length: 6 + rand() * 26,
      thickness: 3 + Math.round(rand() * 9),
      angle: base + j(1.5),
      accent: rand() > 0.78, // a minority of bars carry the accent colour
      origin: "center",
    });
  }

  const elbow = opts.elbow ? buildElbow(node, angle, counterAngle, 26 + rand() * 10) : [];

  return { mode: "asymmetricCross", angle, counterAngle, node, bars, elbow };
}
