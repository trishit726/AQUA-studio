// SolutionArchitecture — a 24s Swiss/Bauhaus-style explainer video in the
// editorial style of the user's reference images. 5 scenes with push-slide
// transitions, wipe-on titles, concentric circles, geometric shapes, and
// the architecture pipeline diagram. Rendered to MP4 via Remotion.
import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { z } from "zod";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { GrainOverlay } from "../lib/textures";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const solutionArchitectureSchema = z.object({});
export type SolutionArchitectureProps = z.infer<typeof solutionArchitectureSchema>;

// ── Timing (30fps) ──
const D1 = 160;  // 0–~5s   Title
const D2 = 160;  // ~5–10s  Problem
const D3 = 160;  // ~10–15s Solution
const D4 = 160;  // ~15–20s Architecture
const D5 = 160;  // ~20–24s End card
const T = 20;    // Transition overlap
export const SA_DURATION = D1 + D2 + D3 + D4 + D5 - 4 * T; // 800 - 80 = 720 frames = 24s

const clamp = (v: number) => Math.max(0, Math.min(1, v));

// ── Animated wipe-on title block ──
const TitleBlock: React.FC<{
  children: React.ReactNode;
  delay?: number;
  color?: string;
  textColor?: string;
  size?: number;
  frame: number;
  fps: number;
}> = ({ children, delay = 0, color = "#f74026", textColor = "#111", size = 110, frame, fps }) => {
  const reveal = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const clip = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
  return (
    <div style={{ clipPath: clip, WebkitClipPath: clip, display: "inline-block" }}>
      <span
        style={{
          display: "inline-block",
          fontFamily: ANTON,
          fontSize: size,
          letterSpacing: 1,
          textTransform: "uppercase",
          lineHeight: 0.92,
          color: textColor,
          background: color,
          padding: "8px 28px 16px",
        }}
      >
        {children}
      </span>
    </div>
  );
};

// ── Scene 1: Title (white grid + concentric circles) ──
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const circleReveal = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  const axisReveal = spring({ frame: frame - 18, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff", overflow: "hidden" }}>
      {/* Grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />
      {/* Diagonal lines */}
      <div
        style={{
          position: "absolute",
          width: 2,
          height: 1400,
          background: "#111",
          top: -160,
          left: 680,
          transform: "rotate(35deg)",
          transformOrigin: "top center",
          opacity: clamp((frame - 4) / 10),
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1,
          height: 1400,
          background: "rgba(0,0,0,0.2)",
          top: -160,
          left: 1100,
          transform: "rotate(35deg)",
          transformOrigin: "top center",
          opacity: clamp((frame - 8) / 10),
        }}
      />

      {/* Title */}
      <div style={{ position: "absolute", left: 180, top: 280, zIndex: 5 }}>
        <TitleBlock frame={frame} fps={fps} delay={8} size={150} color="transparent" textColor="#111">
          SOLUTION
        </TitleBlock>
        <div style={{ marginTop: -8 }}>
          <TitleBlock frame={frame} fps={fps} delay={14} size={150} color="transparent" textColor="#111">
            &amp; ARCHITECTURE
          </TitleBlock>
        </div>
        <div
          style={{
            marginTop: 24,
            marginLeft: 8,
            fontFamily: "Inter, sans-serif",
            fontSize: 28,
            fontWeight: 300,
            color: "#555",
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: clamp((frame - 24) / 8),
          }}
        >
          Aqua Studio — UOE Summer of Code 2026
        </div>
      </div>

      {/* Concentric circles */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 160,
          width: 520,
          height: 520,
          opacity: circleReveal,
          transform: `scale(${circleReveal})`,
        }}
      >
        {[520, 400, 280, 160, 60].map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: r,
              height: r,
              borderRadius: "50%",
              top: 260 - r / 2,
              left: 260 - r / 2,
              border: i === 3 ? "none" : `${i === 2 ? 2 : i === 1 ? 3 : 2}px solid ${i === 4 ? "#111" : "rgba(0,0,0,0.08)"}`,
              background: i === 3 ? "#111" : i === 4 ? "#fff" : "transparent",
            }}
          />
        ))}
        {/* Horizontal axis */}
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 260,
            width: 500,
            height: 2,
            background: "#111",
            transform: `scaleX(${axisReveal})`,
            transformOrigin: "left center",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            background: "#111",
            borderRadius: "50%",
            top: 254,
            left: 4,
            opacity: axisReveal,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            background: "#111",
            borderRadius: "50%",
            top: 254,
            right: 4,
            opacity: axisReveal,
          }}
        />
      </div>

      {/* Bottom label */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 180,
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#999",
          opacity: clamp((frame - 30) / 6),
        }}
      >
        01 / Open Innovation
      </div>

      <GrainOverlay name="s1" intensity={0.04} vignette={false} />
    </AbsoluteFill>
  );
};

// ── Scene 2: The Problem ──
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#111111", overflow: "hidden" }}>
      {/* Grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />

      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 120,
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          opacity: clamp((frame - 4) / 8),
        }}
      >
        The Problem
      </div>

      {/* Title */}
      <div style={{ position: "absolute", left: 120, top: 180, zIndex: 5 }}>
        <TitleBlock frame={frame} fps={fps} delay={8} size={120} color="transparent" textColor="#fff">
          THE
        </TitleBlock>
        <div style={{ marginTop: -6 }}>
          <TitleBlock frame={frame} fps={fps} delay={14} size={120} color="transparent" textColor="#fff">
            BOTTLENECK
          </TitleBlock>
        </div>
      </div>

      {/* Accent line */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 420,
          width: 200,
          height: 4,
          background: "#fff",
          transform: `scaleX(${spring({ frame: frame - 18, fps, config: { damping: 200 } })})`,
          transformOrigin: "left center",
        }}
      />

      {/* Body text */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 480,
          width: 680,
          fontFamily: "Inter, sans-serif",
          fontSize: 24,
          fontWeight: 300,
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.6,
          letterSpacing: 0.5,
          opacity: clamp((frame - 22) / 10),
        }}
      >
        High-end motion graphics are expensive and slow. A single animated title costs hundreds of dollars or hours in After Effects. Template tools look generic; pro tools are too hard for non-designers.
      </div>

      {/* Geometric shapes */}
      <div style={{ position: "absolute", right: 100, top: 200, zIndex: 3, width: 600, height: 600 }}>
        {[
          { w: 200, h: 200, t: 0, l: 200, r: "50%", o: 0.9 },
          { w: 120, h: 120, t: 240, l: 80, r: 0, o: 0.7 },
          { w: 160, h: 160, t: 320, l: 320, r: "50%", o: 0.5, border: "4px solid #fff" },
          { w: 80, h: 80, t: 120, l: 460, r: 0, o: 0.6, rot: 45 },
          { w: 60, h: 60, t: 480, l: 180, r: "50%", o: 0.8 },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: s.w,
              height: s.h,
              top: s.t,
              left: s.l,
              borderRadius: s.r,
              background: s.border ? "transparent" : "#fff",
              border: s.border || "none",
              opacity: spring({ frame: frame - 20 - i * 4, fps, config: { damping: 200 } }) * s.o,
              transform: `scale(${spring({ frame: frame - 20 - i * 4, fps, config: { damping: 200 } })}) rotate(${s.rot || 0}deg)`,
            }}
          />
        ))}
      </div>

      {/* Large number */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 120,
          fontFamily: ANTON,
          fontSize: 180,
          color: "rgba(255,255,255,0.06)",
          lineHeight: 1,
          opacity: clamp((frame - 30) / 8),
        }}
      >
        02
      </div>

      <GrainOverlay name="s2" intensity={0.06} vignette={false} dark />
    </AbsoluteFill>
  );
};

// ── Scene 3: The Solution ──
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const blockReveal = spring({ frame: frame - 4, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff", overflow: "hidden" }}>
      {/* Red block on left */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 720,
          height: 1080,
          background: "#F74026",
          transform: `translateX(${(1 - blockReveal) * -720}px)`,
        }}
      />

      {/* Title on red */}
      <div style={{ position: "absolute", left: 80, top: 200, zIndex: 5 }}>
        <TitleBlock frame={frame} fps={fps} delay={12} size={110} color="transparent" textColor="#111">
          PATTERN
        </TitleBlock>
        <div style={{ marginTop: -6 }}>
          <TitleBlock frame={frame} fps={fps} delay={16} size={110} color="transparent" textColor="#111">
            STUDIO
          </TitleBlock>
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 480,
          zIndex: 5,
          fontFamily: "Inter, sans-serif",
          fontSize: 28,
          fontWeight: 400,
          color: "#111",
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: clamp((frame - 20) / 8),
        }}
      >
        AI Motion Graphics
      </div>

      {/* Right side accent line */}
      <div
        style={{
          position: "absolute",
          left: 820,
          top: 240,
          width: 120,
          height: 4,
          background: "#111",
          transform: `scaleX(${spring({ frame: frame - 24, fps, config: { damping: 200 } })})`,
          transformOrigin: "left center",
        }}
      />

      {/* Description */}
      <div
        style={{
          position: "absolute",
          left: 820,
          top: 280,
          width: 900,
          zIndex: 5,
          fontFamily: "Inter, sans-serif",
          fontSize: 32,
          fontWeight: 300,
          color: "#333",
          lineHeight: 1.5,
          letterSpacing: 0.5,
          opacity: clamp((frame - 26) / 10),
        }}
      >
        Type a one-line brand description. Google Gemini designs a complete scene — headline, palette, geometric pattern, and layout. Edit in a live preview. Export a broadcast-quality MP4 in seconds.
      </div>

      {/* Large number */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 120,
          fontFamily: ANTON,
          fontSize: 180,
          color: "rgba(0,0,0,0.04)",
          lineHeight: 1,
          opacity: clamp((frame - 30) / 8),
        }}
      >
        03
      </div>

      <GrainOverlay name="s3" intensity={0.04} vignette={false} />
    </AbsoluteFill>
  );
};

// ── Scene 4: Architecture Pipeline ──
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodes = [
    { label: "YOU", sub: "One-line prompt", color: "#111111" },
    { label: "EDITOR", sub: "React · Vite", color: "#6fa5a9" },
    { label: "SERVER", sub: "Express :3001", color: "#e0573a" },
    { label: "GEMINI", sub: "AI Designer", color: "#cf9f4a" },
    { label: "REMOTION", sub: "Bundle + Render", color: "#93ab5a" },
    { label: "MP4", sub: "out/*.mp4", color: "#111111" },
  ];

  const nodeSpacing = 280;
  const startX = 150;
  const centerY = 540;

  return (
    <AbsoluteFill style={{ backgroundColor: "#f5f5f5", overflow: "hidden" }}>
      {/* Grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 120,
          zIndex: 10,
          fontFamily: ANTON,
          fontSize: 80,
          color: "#111",
          opacity: clamp((frame - 4) / 8),
        }}
      >
        HOW IT WORKS
      </div>

      {/* Pipeline line */}
      <div
        style={{
          position: "absolute",
          top: centerY,
          left: 120,
          right: 120,
          height: 2,
          background: "rgba(0,0,0,0.1)",
          transform: `scaleX(${spring({ frame: frame - 10, fps, config: { damping: 200 } })})`,
          transformOrigin: "left center",
        }}
      />

      {/* Nodes */}
      {nodes.map((n, i) => {
        const x = startX + i * nodeSpacing;
        const reveal = spring({ frame: frame - 14 - i * 3, fps, config: { damping: 200 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: centerY - 40,
              zIndex: 5,
              opacity: reveal,
              transform: `translateY(${(1 - reveal) * 40}px)`,
            }}
          >
            <div
              style={{
                width: 220,
                padding: "20px 16px",
                fontSize: 32,
                color: "#fff",
                textAlign: "center",
                fontFamily: ANTON,
                letterSpacing: 1,
                lineHeight: 1,
                background: n.color,
              }}
            >
              {n.label}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#888",
                textAlign: "center",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {n.sub}
            </div>
          </div>
        );
      })}

      {/* Data packets */}
      {[0, 1, 2].map((k) => {
        const cycle = 80;
        const t = ((frame - 40 + k * 25) % cycle) / cycle;
        if (frame < 40 + k * 25) return null;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 120 + t * (1920 - 240),
              top: centerY - 8,
              width: 16,
              height: 16,
              background: "#F74026",
              zIndex: 8,
              opacity: t < 0.1 ? t * 10 : t > 0.9 ? (1 - t) * 10 : 1,
            }}
          />
        );
      })}

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 120,
          right: 120,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: 24,
          fontWeight: 300,
          color: "#666",
          letterSpacing: 0.5,
          opacity: clamp((frame - 50) / 10),
        }}
      >
        Prompt → Editable Scene → MP4. One sentence to a video.
      </div>

      <GrainOverlay name="s4" intensity={0.04} vignette={false} />
    </AbsoluteFill>
  );
};

// ── Scene 5: End Card ──
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#111111", overflow: "hidden" }}>
      {/* Grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />

      {/* Centered title */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontFamily: ANTON,
            fontSize: 160,
            color: "#ffffff",
            lineHeight: 0.92,
            opacity: spring({ frame: frame - 8, fps, config: { damping: 200 } }),
            clipPath: `inset(0 ${(1 - spring({ frame: frame - 8, fps, config: { damping: 200 } })) * 100}% 0 0)`,
          }}
        >
          PATTERN
        </div>
        <div
          style={{
            fontFamily: ANTON,
            fontSize: 160,
            color: "#ffffff",
            lineHeight: 0.92,
            marginTop: -8,
            opacity: spring({ frame: frame - 14, fps, config: { damping: 200 } }),
            clipPath: `inset(0 ${(1 - spring({ frame: frame - 14, fps, config: { damping: 200 } })) * 100}% 0 0)`,
          }}
        >
          STUDIO
        </div>
        <div
          style={{
            marginTop: 24,
            fontFamily: "Inter, sans-serif",
            fontSize: 24,
            fontWeight: 300,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: clamp((frame - 24) / 8),
          }}
        >
          Motion, from a prompt
        </div>
      </div>

      {/* Red accent line */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 120,
          width: 80,
          height: 4,
          background: "#F74026",
          transformOrigin: "center center",
          transform: `scaleX(${spring({ frame: frame - 28, fps, config: { damping: 200 } })}) translateX(-50%)`,
        }}
      />

      <GrainOverlay name="s5" intensity={0.06} vignette={false} dark />
    </AbsoluteFill>
  );
};

// ── Main composition with push-slide transitions ──
export const SolutionArchitecture: React.FC<SolutionArchitectureProps> = () => {
  const frame = useCurrentFrame();

  // Transition helpers
  const transitionProgress = (startFrame: number, duration: number) => {
    if (frame < startFrame) return 0;
    if (frame > startFrame + duration) return 1;
    return (frame - startFrame) / duration;
  };

  const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  // Scene positions (push-slide: current goes left, next comes from right)
  const t1 = transitionProgress(D1 - T, T); // 140-160
  const t2 = transitionProgress(D1 + D2 - T, T); // 300-320
  const t3 = transitionProgress(D1 + D2 + D3 - T, T); // 460-480
  const t4 = transitionProgress(D1 + D2 + D3 + D4 - T, T); // 620-640

  const s1X = -t1 * 1920 * easeInOut(t1);
  const s2Enter = t1;
  const s2X = 1920 * (1 - easeInOut(t1)) + (-t2 * 1920 * easeInOut(t2));
  const s3Enter = t2;
  const s3X = 1920 * (1 - easeInOut(t2)) + (-t3 * 1920 * easeInOut(t3));
  const s4Enter = t3;
  const s4X = 1920 * (1 - easeInOut(t3)) + (-t4 * 1920 * easeInOut(t4));
  const s5Enter = t4;
  const s5X = 1920 * (1 - easeInOut(t4));

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Scene 1 */}
      <div style={{ position: "absolute", transform: `translateX(${s1X}px)` }}>
        <Sequence from={0} durationInFrames={D1}>
          <Scene1 />
        </Sequence>
      </div>

      {/* Scene 2 */}
      <div
        style={{
          position: "absolute",
          transform: `translateX(${s2X}px)`,
          opacity: s2Enter > 0 ? 1 : 0,
        }}
      >
        <Sequence from={D1 - T} durationInFrames={D2}>
          <Scene2 />
        </Sequence>
      </div>

      {/* Scene 3 */}
      <div
        style={{
          position: "absolute",
          transform: `translateX(${s3X}px)`,
          opacity: s3Enter > 0 ? 1 : 0,
        }}
      >
        <Sequence from={D1 + D2 - 2 * T} durationInFrames={D3}>
          <Scene3 />
        </Sequence>
      </div>

      {/* Scene 4 */}
      <div
        style={{
          position: "absolute",
          transform: `translateX(${s4X}px)`,
          opacity: s4Enter > 0 ? 1 : 0,
        }}
      >
        <Sequence from={D1 + D2 + D3 - 3 * T} durationInFrames={D4}>
          <Scene4 />
        </Sequence>
      </div>

      {/* Scene 5 */}
      <div
        style={{
          position: "absolute",
          transform: `translateX(${s5X}px)`,
          opacity: s5Enter > 0 ? 1 : 0,
        }}
      >
        <Sequence from={D1 + D2 + D3 + D4 - 4 * T} durationInFrames={D5}>
          <Scene5 />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
