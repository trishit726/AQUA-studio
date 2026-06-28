// PatternField — renders a PatternGen placement as animated DOM/SVG, driven by
// useCurrentFrame(). Squares + tiles reveal with a clip-side wipe (staggered by
// each element's seeded animDelay); dots pulse. Deterministic per seed.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import {
  ANIM_TYPES,
  type TitleRect,
  type AnimType,
} from "./engine";
import { clipFor, revealProgress, clamp01 } from "../../engine/motion";
import { generatePattern } from "../../engine/pattern";
import type { MotifPreference } from "../../style/types";

const DUR = 14; // reveal duration per element

// 16 built-in 40x40 shapes matching the halfof8 selector grid. fg shape, transparent bg.
// Exported so the web app's shape selector shows the same thumbnails.
export const Shape: React.FC<{ anim: AnimType; fg: string }> = ({ anim, fg }) => {
  const f = { fill: fg } as const;
  const dot = (x: number, y: number, r = 3.4) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} {...f} />;
  const S = (children: React.ReactNode) => (
    <svg viewBox="0 0 40 40" width="100%" height="100%">{children}</svg>
  );
  switch (anim) {
    case "arrowUp":
      return S(<path d="M20 5 L34 21 L27 21 L27 35 L13 35 L13 21 L6 21 Z" {...f} />);
    case "capsuleDiag":
      return S(<rect x={8} y={17} width={24} height={7} rx={3.5} transform="rotate(-45 20 20)" {...f} />);
    case "capsuleH":
      return S(<rect x={5} y={16} width={30} height={8} rx={4} {...f} />);
    case "plug":
      return S(<>
        <rect x={5} y={10} width={30} height={7} rx={3.5} {...f} />
        <rect x={5} y={23} width={30} height={7} rx={3.5} {...f} />
      </>);
    case "hBars":
      return S(<>
        <rect x={8} y={6} width={7} height={28} rx={2} {...f} />
        <rect x={25} y={6} width={7} height={28} rx={2} {...f} />
        <rect x={8} y={17} width={24} height={6} {...f} />
      </>);
    case "barsII":
      return S(<>
        <rect x={11} y={7} width={7} height={26} rx={3} {...f} />
        <rect x={22} y={7} width={7} height={26} rx={3} {...f} />
      </>);
    case "circle":
      return S(<circle cx={20} cy={20} r={13} {...f} />);
    case "target":
      return S(<>
        <circle cx={20} cy={20} r={13} fill="none" stroke={fg} strokeWidth={5} />
        <circle cx={20} cy={20} r={4} {...f} />
      </>);
    case "squares4":
      return S(<>
        <rect x={7} y={7} width={10} height={10} {...f} />
        <rect x={23} y={7} width={10} height={10} {...f} />
        <rect x={7} y={23} width={10} height={10} {...f} />
        <rect x={23} y={23} width={10} height={10} {...f} />
      </>);
    case "xCross":
      return S(<>
        <rect x={17} y={4} width={6} height={32} rx={2} transform="rotate(45 20 20)" {...f} />
        <rect x={17} y={4} width={6} height={32} rx={2} transform="rotate(-45 20 20)" {...f} />
      </>);
    case "dotGrid":
      return S([6, 14, 22, 30].map((y) => [6, 14, 22, 30].map((x) => dot(x, y, 2.2))));
    case "dots3":
      return S(<>{dot(10, 12)}{dot(22, 22)}{dot(30, 30)}</>);
    case "dice5":
      return S(<>{dot(10, 10)}{dot(30, 10)}{dot(20, 20)}{dot(10, 30)}{dot(30, 30)}</>);
    case "dice2":
      return S(<>{dot(12, 12, 4)}{dot(28, 28, 4)}</>);
    case "nested":
      return S(<>
        <rect x={6} y={6} width={28} height={28} fill="none" stroke={fg} strokeWidth={4} />
        <rect x={16} y={16} width={8} height={8} {...f} />
      </>);
    case "stripes":
    default:
      return S([2, 14, 26].map((x) => <rect key={x} x={x} y={-6} width={6} height={52} transform={`rotate(20 ${x} 20)`} {...f} />));
  }
};

export const PatternField: React.FC<{
  titles: TitleRect[];
  colors: string[];
  density: number;
  proximity: number;
  seed: number;
  begin?: number;
  stagger?: number; // 0 = all reveal together, 5 = maximally spread
  enabledAnims?: AnimType[];
  amp?: number; // 0..1 audio energy — pulses shapes/dots when audio-reactive
  motifs?: MotifPreference[]; // which motifs to generate (defaults to legacy scatter)
}> = ({ titles, colors, density, proximity, seed, begin = 0, stagger = 3, enabledAnims = ANIM_TYPES, amp = 0, motifs }) => {
  const SPREAD = 6 + stagger * 10; // frames over which elements stagger in
  const frame = useCurrentFrame();

  // Generation is deterministic + frame-independent, so run the motifs ONCE per
  // input set (memoized) rather than every frame. The string signature keeps the
  // memo stable even though array props are fresh references each render.
  const sig = JSON.stringify([titles, colors, density, proximity, seed, enabledAnims, motifs]);
  const elements = useMemo(
    () => generatePattern({ titles, colors, density, proximity, seed, enabledAnims }, motifs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sig],
  );

  const f = frame - begin;
  const prog = (delay: number) => revealProgress(f, delay, SPREAD, DUR);

  return (
    <>
      {elements.map((el) => {
        if (el.kind === "square") {
          const p = prog(el.seedPhase);
          if (p <= 0) return null;
          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: el.rect.x,
                top: el.rect.y,
                width: el.rect.w,
                height: el.rect.h,
                background: el.color,
                clipPath: clipFor(el.clipSide, p),
                WebkitClipPath: clipFor(el.clipSide, p),
              }}
            />
          );
        }

        if (el.kind === "glyph") {
          const p = prog(el.seedPhase);
          if (p <= 0) return null;
          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: el.rect.x,
                top: el.rect.y,
                width: el.rect.w,
                height: el.rect.h,
                background: el.colors.bg,
                clipPath: clipFor(el.clipSide, p),
                WebkitClipPath: clipFor(el.clipSide, p),
                transform: amp ? `scale(${1 + amp * 0.55})` : undefined,
                transformOrigin: "center",
              }}
            >
              <Shape anim={el.glyph} fg={el.colors.fg} />
            </div>
          );
        }

        if (el.kind === "bar") {
          const p = prog(el.seedPhase);
          if (p <= 0) return null;
          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: el.rect.x,
                top: el.rect.y,
                width: el.rect.w,
                height: el.rect.h,
                background: el.color,
                transform: `rotate(${el.rotation}deg)`,
                transformOrigin: "left center",
                clipPath: clipFor(el.clipSide, p),
                WebkitClipPath: clipFor(el.clipSide, p),
              }}
            />
          );
        }

        if (el.kind === "disc" || el.kind === "ring") {
          const p = prog(el.seedPhase);
          if (p <= 0) return null;
          const isRing = el.kind === "ring";
          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: el.cx - el.r,
                top: el.cy - el.r,
                width: el.r * 2,
                height: el.r * 2,
                borderRadius: "50%",
                ...(isRing
                  ? { border: `${el.thickness}px solid ${el.color}`, background: "transparent" }
                  : { background: el.color }),
                opacity: p,
                transform: `scale(${0.7 + p * 0.3})`,
                transformOrigin: "center",
              }}
            />
          );
        }

        // el.kind === "dot"
        const appear = clamp01((f - el.blinkPhase * SPREAD) / 8);
        if (appear <= 0) return null;
        const blink = 0.5 + 0.5 * Math.sin(frame * el.blinkSpeed + el.blinkPhase * Math.PI * 2);
        return (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              width: 9,
              height: 9,
              borderRadius: 3,
              background: el.color,
              opacity: Math.min(1, appear * (0.4 + 0.6 * blink) * (1 + amp * 1.3)),
              transform: amp ? `scale(${1 + amp * 1.1})` : undefined,
            }}
          />
        );
      })}
    </>
  );
};
