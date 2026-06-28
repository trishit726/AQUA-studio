// Eye motif — a vesica (almond) eye whose iris + pupil are CLIPPED by the eye
// shape, so a travelling pupil disappears behind the lid at the edges. Phase 1
// renders it at rest (pupil centred); motion (pupil travel) is layered later via
// the `gaze` 0..1 offsets the motion layer will supply.
import React from "react";

export type EyeProps = {
  cx: number;
  cy: number;
  w: number; // eye width (px)
  h: number; // eye height (px)
  ink: string;
  mid: string;
  accent: string; // "" = none
  // Normalised pupil offset, -1..1 on each axis. 0,0 = resting (Phase 1).
  gazeX?: number;
  gazeY?: number;
  // Continuous spin of the iris striations, in radians (motion layer supplies it).
  spin?: number;
  clipId: string;
};

// A vesica/lens outline: two quadratic arcs meeting at the corners.
const lensPath = (cx: number, cy: number, w: number, h: number) => {
  const hw = w / 2;
  const hh = h / 2;
  return `M ${cx - hw},${cy} Q ${cx},${cy - hh} ${cx + hw},${cy} Q ${cx},${cy + hh} ${cx - hw},${cy} Z`;
};

export const EyeMotif: React.FC<EyeProps> = ({
  cx,
  cy,
  w,
  h,
  ink,
  mid,
  accent,
  gazeX = 0,
  gazeY = 0,
  spin = 0,
  clipId,
}) => {
  const irisR = (h / 2) * 0.92;
  const pupilR = irisR * 0.4;
  const pupilColor = accent || ink;

  // Pupil travels within the eye; the clip hides it past the lid.
  const travelX = (w / 2 - irisR * 0.5) * gazeX;
  const travelY = (h / 2 - pupilR) * gazeY;
  const px = cx + travelX;
  const py = cy + travelY;

  // Iris striation ticks, rotating slowly (spin).
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2 + spin;
    const r0 = irisR * 0.5;
    const r1 = irisR * 0.96;
    return {
      x1: cx + Math.cos(a) * r0,
      y1: cy + Math.sin(a) * r0,
      x2: cx + Math.cos(a) * r1,
      y2: cy + Math.sin(a) * r1,
    };
  });

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={lensPath(cx, cy, w, h)} />
        </clipPath>
      </defs>

      {/* Eye outline. */}
      <path d={lensPath(cx, cy, w, h)} fill="none" stroke={ink} strokeWidth={2} />

      {/* Everything inside is clipped by the lens shape. */}
      <g clipPath={`url(#${clipId})`}>
        <circle cx={cx} cy={cy} r={irisR} fill="none" stroke={mid} strokeWidth={1.5} />
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={mid}
            strokeWidth={1}
            opacity={0.55}
          />
        ))}
        <circle cx={px} cy={py} r={pupilR} fill={pupilColor} />
        {/* catchlight */}
        <circle cx={px - pupilR * 0.3} cy={py - pupilR * 0.3} r={pupilR * 0.18} fill={ink} opacity={0.0} />
      </g>
    </g>
  );
};
