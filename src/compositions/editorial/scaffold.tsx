// The fixed editorial scaffold — IDENTICAL across every variation. Driven only by
// text props + `ornamentDensity`. This is the locked "style chrome": thin border,
// corner crop-marks, four-point stars, split numerals (opposite corners), centred
// logo, dashed top rule, header block + tagline. No motif, no motion here.
import React from "react";

export type ScaffoldProps = {
  w: number;
  h: number;
  ink: string;
  mid: string;
  paper: string;
  accent: string; // "" = none
  headline: string;
  tagline: string;
  cornerLeft: string;
  cornerRight: string;
  logoText: string;
  header: "top" | "bottom";
  ornamentDensity: number; // 0..1
  // Per-element reveal opacities (1 everywhere in the static Phase 1).
  reveal?: (key: string) => number;
};

// A four-point star ("sparkle") path centred at (cx,cy), tip radius R.
const star = (cx: number, cy: number, R: number) => {
  const r = R * 0.16; // waist radius — sharp concave points
  return [
    `M ${cx},${cy - R}`,
    `L ${cx + r},${cy - r}`,
    `L ${cx + R},${cy}`,
    `L ${cx + r},${cy + r}`,
    `L ${cx},${cy + R}`,
    `L ${cx - r},${cy + r}`,
    `L ${cx - R},${cy}`,
    `L ${cx - r},${cy - r}`,
    "Z",
  ].join(" ");
};

// An L-shaped crop mark at corner (x,y); dx/dy give the inward direction (±1).
const cropMark = (x: number, y: number, dx: number, dy: number, len: number) =>
  `M ${x + dx * len},${y} L ${x},${y} L ${x},${y + dy * len}`;

export const Scaffold: React.FC<ScaffoldProps> = ({
  w,
  h,
  ink,
  mid,
  accent,
  headline,
  tagline,
  cornerLeft,
  cornerRight,
  logoText,
  header,
  ornamentDensity,
  reveal = () => 1,
}) => {
  const inset = Math.round(w * 0.028); // border position
  const pad = Math.round(w * 0.068); // flush-left content margin
  const ruleY = Math.round(h * 0.135);
  const logoY = Math.round(h * 0.078);

  // Header block sits high or low; tagline rides just under the headline, offset
  // by however many lines the headline wraps to so the two never collide.
  const headTop = header === "top" ? Math.round(h * 0.66) : Math.round(h * 0.74);
  const headFontSize = 84;
  const headLineH = headFontSize * 0.88;
  const headLines = headline.split("\n").length;
  const taglineTop = headTop + Math.round(headLines * headLineH) + 26;

  // Density gates the optional ornament count (the core frame always shows).
  const starCount = Math.round(2 + ornamentDensity * 6); // 2..8
  const starR = 9;
  // Stars flank the logo and tuck inside the four corners, in a fixed order so
  // density just reveals more of the same on-brand set.
  const starSlots: [number, number][] = [
    [w / 2 - 150, logoY + 2],
    [w / 2 + 150, logoY + 2],
    [inset + 46, inset + 46],
    [w - inset - 46, inset + 46],
    [inset + 46, h - inset - 46],
    [w - inset - 46, h - inset - 46],
    [w / 2, ruleY],
    [pad, headTop - 70],
  ];
  const stars = starSlots.slice(0, starCount);

  const o = (k: string) => reveal(k);

  return (
    <>
      {/* ── Vector chrome ─────────────────────────────────────────────────── */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Thin border */}
        <rect
          x={inset}
          y={inset}
          width={w - inset * 2}
          height={h - inset * 2}
          fill="none"
          stroke={ink}
          strokeWidth={1.5}
          opacity={o("border")}
        />

        {/* Corner crop-marks (just inside the border) */}
        {(
          [
            [inset + 16, inset + 16, 1, 1],
            [w - inset - 16, inset + 16, -1, 1],
            [inset + 16, h - inset - 16, 1, -1],
            [w - inset - 16, h - inset - 16, -1, -1],
          ] as [number, number, number, number][]
        ).map(([x, y, dx, dy], i) => (
          <path
            key={i}
            d={cropMark(x, y, dx, dy, 22)}
            fill="none"
            stroke={ink}
            strokeWidth={1.5}
            opacity={o("border")}
          />
        ))}

        {/* Dashed top rule */}
        <line
          x1={pad}
          y1={ruleY}
          x2={w - pad}
          y2={ruleY}
          stroke={ink}
          strokeWidth={1.5}
          strokeDasharray="2 9"
          opacity={o("rule")}
        />

        {/* Four-point stars (density-gated) */}
        {stars.map(([cx, cy], i) => (
          <path key={i} d={star(cx, cy, starR)} fill={mid} opacity={o("stars") * 0.9} />
        ))}
      </svg>

      {/* ── Text chrome ───────────────────────────────────────────────────── */}
      {/* Centred logo wordmark */}
      <div
        style={{
          position: "absolute",
          top: logoY - 14,
          left: 0,
          width: w,
          textAlign: "center",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 8,
          color: ink,
          textTransform: "uppercase",
          opacity: o("logo"),
        }}
      >
        {logoText}
      </div>

      {/* Split numerals — opposite corners */}
      <div
        style={{
          position: "absolute",
          top: Math.round(h * 0.175),
          left: pad,
          fontSize: 96,
          fontWeight: 900,
          lineHeight: 0.9,
          letterSpacing: -3,
          color: ink,
          opacity: o("numerals"),
        }}
      >
        {cornerLeft}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: Math.round(h * 0.07),
          right: pad,
          fontSize: 96,
          fontWeight: 900,
          lineHeight: 0.9,
          letterSpacing: -3,
          color: ink,
          textAlign: "right",
          opacity: o("numerals"),
        }}
      >
        {cornerRight}
      </div>

      {/* Header block (flush-left) + tagline */}
      <div
        style={{
          position: "absolute",
          top: headTop,
          left: pad,
          maxWidth: Math.round(w * 0.42),
          color: ink,
          opacity: o("header"),
        }}
      >
        <div
          style={{
            fontSize: headFontSize,
            fontWeight: 900,
            lineHeight: 0.88,
            letterSpacing: -2,
            textTransform: "uppercase",
            whiteSpace: "pre-line",
          }}
        >
          {headline}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: taglineTop,
          left: pad,
          maxWidth: Math.round(w * 0.38),
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 1,
          lineHeight: 1.35,
          color: mid,
          opacity: o("tagline"),
        }}
      >
        {tagline}
      </div>

      {accent && (
        <div
          style={{
            position: "absolute",
            top: headTop - 24,
            left: pad,
            width: 56,
            height: 6,
            backgroundColor: accent,
            opacity: o("header"),
          }}
        />
      )}
    </>
  );
};
