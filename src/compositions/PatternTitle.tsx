// PatternTitle — the core graphic: one or more text blocks with a procedural
// generator scattering animated shapes/squares/dots around them. Titles are an
// array (main block / sub-label / optional vertical CJK), each positioned by
// (x,y). Uses the ported PatternGen engine (see src/lib/patterngen, MIT — credit
// in NOTICE.md). Fully parameterized → drives the web app + AI scene generation.
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { loadFont as loadJP } from "@remotion/google-fonts/ShipporiMincho";
import { resolveStyle, loadStyleFont } from "../style";
import { PatternField } from "../lib/patterngen/PatternField";
import { FloodField } from "../lib/patterngen/FloodField";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { GrainOverlay } from "../lib/textures";
import type { TitleRect, AnimType } from "../lib/patterngen/engine";

const resolveSrc = (s: string) => (/^(https?:|blob:|data:)/.test(s) ? s : staticFile(s));

// Phase 1 of the Style Engine refactor: the renderer sources its font + texture
// from the resolved "default" StyleSpec instead of inline constants. The default
// pack encodes today's exact values, so output stays pixel-identical. (See
// docs/style-engine-architecture.md.)
const STYLE = resolveStyle("default");
const ANTON = loadStyleFont(STYLE.typography.headlineFont); // Anton, weight 400
const { fontFamily: JP } = loadJP("normal", { weights: ["500"], subsets: ["latin"] });

const titleSchema = z.object({
  id: z.string(),
  kind: z.enum(["block", "label", "jp"]),
  text: z.string(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  size: z.number().min(8).max(400),
  color: z.string().optional(), // per-title box colour (defaults to accent / black)
  dir: z.enum(["left", "right", "up", "down"]).optional(), // entrance direction (wipe/rise)
});
export type TitleItem = z.infer<typeof titleSchema>;

export const patternTitleSchema = z.object({
  titles: z.array(titleSchema),
  seed: z.number().int(),
  density: z.number().min(1).max(20),
  proximity: z.number().min(1).max(20),
  accent: zColor(),
  bgColor: zColor(),
  bgImage: z.string(),
  stagger: z.number().min(0).max(5),
  shapes: z.array(z.string()),
  paint: z.number().min(0).max(120),
  colors: z.array(z.string()), // palette that feeds the patterns/squares/dots
  scatter: z.boolean().optional(), // false = no scattered random shapes (title only)
  showGrid: z.boolean(),
  music: z.string().optional(), // public/ path for a lo-fi bed, e.g. "music/lofi.mp3"
  sfx: z.boolean().optional(), // play a slap SFX on each title reveal
  audioReactive: z.boolean().optional(), // pulse the pattern to the music's energy
  intro: z.enum(["none", "flood"]).optional(), // "flood" = full-screen colour grid sweep
  floodStyle: z.enum(["random", "sweep", "radial", "rows", "columns", "edges"]).optional(),
  floodSpeed: z.number().min(1).max(10).optional(),
  floodTile: z.number().min(1).max(10).optional(),
  floodShapes: z.number().min(0).max(10).optional(),
  floodPersist: z.boolean().optional(),
  floodSolid: z.boolean().optional(), // true = whole flood one colour (the accent)
  // ── Camera: a virtual move over the whole scene (drives MP4 + live preview) ──
  cameraMove: z.enum(["none", "pushIn", "pushOut", "pan", "kenBurns"]).optional(),
  cameraDir: z.enum(["left", "right", "up", "down"]).optional(), // for pan / kenBurns
  cameraAmount: z.number().min(1).max(10).optional(), // move intensity
  // ── Title motion: how the text blocks enter ──
  titleAnim: z.enum(["wipe", "perLetter", "rise", "fade"]).optional(),
  underline: z.boolean().optional(), // animated accent underline that sweeps under each title
});
export type PatternTitleProps = z.infer<typeof patternTitleSchema>;

export const patternTitleDefaults: PatternTitleProps = {
  titles: [
    { id: "t1", kind: "block", text: "PATTERN\nSTUDIO", x: 0.36, y: 0.46, size: 130 },
    { id: "t2", kind: "label", text: "MOTION, FROM A PROMPT", x: 0.36, y: 0.61, size: 30 },
  ],
  seed: 7,
  density: 10,
  proximity: 2,
  accent: "#f74026",
  bgColor: "#2b2b2b",
  bgImage: "",
  stagger: 3,
  shapes: ["arrowUp", "capsuleDiag", "capsuleH", "plug", "hBars", "barsII", "circle", "target", "squares4", "xCross", "dotGrid", "dots3", "dice5", "dice2", "nested", "stripes"],
  paint: 50,
  colors: ["#6fa5a9", "#93ab5a", "#cf9f4a", "#e0573a", "#000000", "#ffffff"],
  scatter: true,
  showGrid: false,
  music: "",
  sfx: false,
  audioReactive: false,
  intro: "none",
  floodStyle: "random",
  floodSpeed: 5,
  floodTile: 6,
  floodShapes: 5,
  floodPersist: true,
  floodSolid: false,
  cameraMove: "none",
  cameraDir: "right",
  cameraAmount: 5,
  titleAnim: "wipe",
  underline: false,
};

// Approximate the bounding box of a title so the engine keeps patterns clear of it.
const rectOf = (t: TitleItem): TitleRect => {
  const cx = t.x * 1920, cy = t.y * 1080;
  if (t.kind === "jp") {
    const w = t.size * 1.6, h = t.text.length * t.size * 1.1 + 20;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }
  const lines = t.text.split("\n");
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const w = longest * t.size * 0.62 + 40, h = lines.length * t.size * 1.02 + 24;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
};

const titleLum = (hex: string): number => {
  const h = hex.replace("#", "");
  if (h.length < 6) return 0.5;
  return (0.299 * parseInt(h.slice(0, 2), 16) + 0.587 * parseInt(h.slice(2, 4), 16) + 0.114 * parseInt(h.slice(4, 6), 16)) / 255;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type CameraMove = NonNullable<PatternTitleProps["cameraMove"]>;
type Dir = NonNullable<TitleItem["dir"]>;

// A virtual 2D camera over the whole scene. Returns a CSS transform string driven
// by the playhead, so it animates identically in the live preview and the MP4.
// Pan / Ken Burns add a base overscan so the move never reveals the canvas edges.
const cameraTransform = (move: CameraMove, dir: Dir, amount: number, frame: number, duration: number): string => {
  if (move === "none") return "none";
  const p = interpolate(frame, [0, Math.max(1, duration - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const amt = amount / 10; // 0..1
  let scale = 1, tx = 0, ty = 0; // tx/ty in % of the element (1920×1080)
  if (move === "pushIn") scale = lerp(1, 1 + 0.3 * amt, p);
  else if (move === "pushOut") scale = lerp(1 + 0.3 * amt, 1, p);
  else if (move === "pan") {
    scale = 1.16 + 0.05 * amt;
    const d = 9 * amt;
    if (dir === "left") tx = lerp(d, -d, p);
    else if (dir === "right") tx = lerp(-d, d, p);
    else if (dir === "up") ty = lerp(d, -d, p);
    else ty = lerp(-d, d, p);
  } else if (move === "kenBurns") {
    scale = lerp(1.14, 1.14 + 0.2 * amt, p);
    const d = 5 * amt;
    const sx = dir === "left" ? 1 : dir === "right" ? -1 : 0.7;
    const sy = dir === "up" ? 1 : dir === "down" ? -1 : 0.7;
    tx = lerp(0, -d * sx, p);
    ty = lerp(0, -d * sy, p);
  }
  return `translate(${tx}%, ${ty}%) scale(${scale})`;
};

// Animated text reveal for a single title. Encapsulates the four entrance styles
// (wipe / per-letter / rise / fade), the per-title direction, and the optional
// underline sweep — all derived from `frame` so preview and render stay in sync.
const AnimatedTitle: React.FC<{
  t: TitleItem; accent: string; frame: number; fps: number; delay: number;
  anim: NonNullable<PatternTitleProps["titleAnim"]>; underline: boolean;
}> = ({ t, accent, frame, fps, delay, anim, underline }) => {
  const dir: Dir = t.dir ?? "left";
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });

  // Reveal → outer clip + extra transform layered on top of the centring translate.
  let clip = "none";
  let extra = "";
  let opacity = 1;
  if (anim === "wipe") {
    const r = (1 - p) * 100;
    clip = dir === "left" ? `inset(0 ${r}% 0 0)`
      : dir === "right" ? `inset(0 0 0 ${r}%)`
      : dir === "up" ? `inset(0 0 ${r}% 0)`
      : `inset(${r}% 0 0 0)`;
  } else if (anim === "rise") {
    const o = (1 - p) * 60;
    const tx = dir === "left" ? -o : dir === "right" ? o : 0;
    const ty = dir === "up" ? -o : dir === "down" ? o : 0;
    extra = `translate(${tx}px, ${ty}px)`;
    opacity = p;
  } else if (anim === "fade") {
    extra = `scale(${lerp(0.92, 1, p)})`;
    opacity = p;
  }

  const boxColor = t.color ?? (t.kind === "label" ? "#111111" : accent);
  const textColor = t.color ? (titleLum(boxColor) > 0.55 ? "#111111" : "#ffffff") : t.kind === "label" ? "#fff" : "#111";

  const fontStyle: React.CSSProperties = t.kind === "jp"
    ? { fontFamily: JP, fontSize: t.size, fontWeight: 500, writingMode: "vertical-rl", letterSpacing: 4, padding: "16px 8px" }
    : t.kind === "label"
      ? { fontFamily: ANTON, fontSize: t.size, letterSpacing: 2, textTransform: "uppercase", padding: "5px 14px 8px" }
      : { fontFamily: ANTON, fontSize: t.size, lineHeight: 0.96, letterSpacing: 1, textTransform: "uppercase", padding: "8px 26px 16px" };

  const box: React.CSSProperties = { display: "inline-block", background: boxColor, color: textColor, ...fontStyle };

  // Per-letter: characters rise + fade in sequence; the box fades with the first chars.
  let inner: React.ReactNode;
  if (anim === "perLetter" && t.kind !== "jp") {
    box.opacity = Math.min(1, spring({ frame: frame - delay, fps, config: { damping: 200 } }) * 1.6);
    const lines = t.text.split("\n");
    let idx = 0;
    inner = lines.map((line, li) => (
      <React.Fragment key={li}>
        {Array.from(line).map((ch) => {
          const i = idx++;
          const lp = spring({ frame: frame - delay - i * 1.6, fps, config: { damping: 200, stiffness: 130 } });
          return (
            <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - lp) * 18}px)`, opacity: lp }}>
              {ch === " " ? " " : ch}
            </span>
          );
        })}
        {li < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  } else {
    inner = t.kind === "block"
      ? t.text.split("\n").map((l, i, a) => (<React.Fragment key={i}>{l}{i < a.length - 1 && <br />}</React.Fragment>))
      : t.text;
  }

  const u = spring({ frame: frame - delay - 6, fps, config: { damping: 200 } });
  const base: React.CSSProperties = {
    position: "absolute",
    left: `${t.x * 100}%`,
    top: `${t.y * 100}%`,
    transform: `translate(-50%, -50%)${extra ? " " + extra : ""}`,
    clipPath: clip,
    WebkitClipPath: clip,
    opacity,
    textAlign: t.kind === "block" ? "center" : "left",
  };

  return (
    <div style={base}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <span style={box}>{inner}</span>
        {underline ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: -12, height: Math.max(4, t.size * 0.06), background: accent, transformOrigin: "left", transform: `scaleX(${u})` }} />
        ) : null}
      </div>
    </div>
  );
};

export const PatternTitle: React.FC<PatternTitleProps> = ({
  titles, seed, density, proximity, accent, bgColor, bgImage, stagger, shapes, colors, scatter, showGrid, music, sfx, audioReactive, intro,
  floodStyle, floodSpeed, floodTile, floodShapes, floodPersist, floodSolid,
  cameraMove, cameraDir, cameraAmount, titleAnim, underline,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const camera = cameraTransform(cameraMove ?? "none", cameraDir ?? "right", cameraAmount ?? 5, frame, durationInFrames);
  const anim = titleAnim ?? "wipe";
  const fieldProps = {
    titles: titles.map(rectOf),
    colors: colors.length ? colors : [accent],
    density,
    proximity,
    seed,
    begin: 4,
    stagger,
    enabledAnims: shapes as AnimType[],
    // Phase 3: geometry now flows through motifs. The default style resolves to
    // the legacy `patterngen16` scatter motif → pixel-identical output.
    motifs: STYLE.visualLanguage.motifs,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
      {/* Lo-fi music bed (optional). Track plays from the top; comp is short so no loop needed. */}
      {music ? <Audio src={resolveSrc(music)} volume={0.4} /> : null}

      {/* Slap SFX on each title reveal (optional) — whoosh for blocks, click for the rest. */}
      {sfx
        ? titles.map((t, i) => (
            <Sequence key={`sfx-${t.id}`} from={8 + i * 4}>
              <Audio src={staticFile(t.kind === "block" ? "sfx/whoosh.wav" : "sfx/click.wav")} volume={0.5} />
            </Sequence>
          ))
        : null}

      {/* Everything inside this layer moves together under the virtual camera.
          The grain/vignette below stays screen-fixed (it's a lens effect). */}
      <AbsoluteFill style={{ transform: camera, transformOrigin: "center center" }}>
        {bgImage ? (
          <AbsoluteFill style={{ overflow: "hidden" }}>
            <Img src={resolveSrc(bgImage)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
        ) : null}

        {/* optional 20px alignment grid (patterngen "GRID ON") */}
        {showGrid ? (
          <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.07, backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        ) : null}

        {(scatter ?? true) ? (
          music && audioReactive ? (
            <ReactiveField music={music} {...fieldProps} />
          ) : (
            <PatternField {...fieldProps} />
          )
        ) : null}

        {intro === "flood" ? (
          <AbsoluteFill>
            <FloodField accent={accent} colors={colors} seed={seed} begin={2}
              style={floodStyle} speed={floodSpeed} tile={floodTile} shapes={floodShapes} persist={floodPersist} solid={floodSolid} />
          </AbsoluteFill>
        ) : null}

        <AbsoluteFill>
          {titles.map((t, i) => (
            <AnimatedTitle key={t.id} t={t} accent={accent} frame={frame} fps={fps} delay={8 + i * 4} anim={anim} underline={underline ?? false} />
          ))}
        </AbsoluteFill>
      </AbsoluteFill>

      <GrainOverlay name="pattern" intensity={STYLE.texture.intensity} vignette={STYLE.texture.vignette} dark />
    </AbsoluteFill>
  );
};

// Audio-reactive wrapper: pulses the pattern with the music's low-frequency energy.
const ReactiveField: React.FC<React.ComponentProps<typeof PatternField> & { music: string }> = ({ music, ...rest }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(music));
  let amp = 0;
  if (audioData) {
    const bins = visualizeAudio({ fps, frame, audioData, numberOfSamples: 32, optimizeFor: "speed" });
    const low = ((bins[0] ?? 0) + (bins[1] ?? 0) + (bins[2] ?? 0) + (bins[3] ?? 0)) / 4;
    amp = Math.min(1, low * 3.2);
  }
  return <PatternField {...rest} amp={amp} />;
};
