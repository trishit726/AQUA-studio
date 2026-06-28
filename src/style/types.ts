// ─────────────────────────────────────────────────────────────────────────────
// StyleSpec — the visual GRAMMAR of a style.
//
// A StyleSpec defines parameters, ranges, and vocabularies — never concrete
// objects or fixed coordinates. The Composition / Pattern / Motion / Effects
// modules consume a StyleSpec + a seed to PRODUCE the concrete objects, so two
// renders of one style look like siblings, never twins.
//
// Strategy *implementations* are NOT here — the spec references them by id
// (LayoutStrategyId, GeometryVocabId, TextureId, EffectType). Implementations
// live in registries (see registry.ts). That indirection is what makes
// "add a style = add a config".
//
// See docs/style-engine-architecture.md for the full rationale.
// ─────────────────────────────────────────────────────────────────────────────

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface ColorPair {
  bg: string
  fg: string
}

/**
 * A font the renderer can load. `googleFont` is the @remotion/google-fonts
 * module name (e.g. "Anton", "Archivo", "ShipporiMincho", "SpaceMono"); the
 * font registry maps it to a loaded family at render time.
 */
export interface FontRef {
  googleFont: string
  weights: string[]
  /** Optional CSS fallback stack if the google font fails to load. */
  fallback?: string
}

// ── Strategy id unions ───────────────────────────────────────────────────────
// Open string unions: known ids are listed for autocomplete, but any registered
// id is valid (a new strategy module can register a new id without editing this).
export type LayoutStrategyId =
  | "freeform" // current behaviour: titles placed by explicit (x,y)
  | "grid"
  | "radial"
  | "editorial"
  | "asymmetric"
  | (string & {})

export type GeometryVocabId =
  | "patterngen16" // the existing 16-shape set
  | "swissBars"
  | "hudTicks"
  | "none"
  | (string & {})

export type FocalMotifId =
  | "hinomaru" // Japanese red circle
  | "diagonalAxis" // Swiss diagonal bar axis
  | "hudFrame" // Cyber HUD bracket frame
  | "none"
  | (string & {})

export type TextureId =
  | "grain"
  | "paper"
  | "noise"
  | "glass"
  | "blueprint"
  | "none"
  | (string & {})

export type EasingId =
  | "outExpo"
  | "inOutCubic"
  | "linear"
  | `spring(${number})`
  | (string & {})

export type EnterStyle = "wipe" | "rise" | "fade" | "perLetter" | "drawOn"

export type EffectType =
  | "scatter"
  | "fold"
  | "flood"
  | "explode"
  | "dissolve"
  | "morph"
  | "wave"
  | (string & {})

/** One composable effect, applied in array order. `params` is effect-specific. */
export interface EffectSpec {
  type: EffectType
  enabled: boolean
  params?: Record<string, number | string | boolean>
}

// ── Spec sections (map 1:1 to the user's required parameter groups) ──────────

export interface TypographySpec {
  headlineFont: FontRef
  labelFont: FontRef
  monoFont?: FontRef
  case: "upper" | "lower" | "title" | "as-is"
  /** Allowed font weights, e.g. [400, 700, 900]. */
  weightScale: number[]
  /** Size ratios per role, e.g. [1, 0.32, 0.12] = headline / label / caption. */
  hierarchy: number[]
  /** Letter-spacing rhythm (px). */
  tracking: number
  align: "flush-left" | "centered" | "justified" | "vertical-rl"
}

export interface LayoutSpec {
  strategy: LayoutStrategyId
  columns: number
  rotation?: { enabled: boolean; range: [number, number] }
  bias: "center" | "left" | "corner-anchored"
}

export interface SpacingSpec {
  /** Title-safe inset, as a % of the frame. */
  margin: number
  /** Base spacing unit in px (generalizes the fixed GRID_SIZE=20). */
  rhythm: number
  whitespace: "dense" | "balanced" | "generous"
}

/** A motif this style prefers, with a blend weight. Motifs are PORTABLE — any
 *  motif is usable by any style; a style merely expresses preference + weight,
 *  which is what makes Style Stacks expressive. */
export interface MotifPreference {
  id: string
  weight: number
}

export interface VisualLanguageSpec {
  /** Primitive glyph set motifs may draw from (the 16 shapes, swiss bars, …). */
  geometry: GeometryVocabId
  /** Primary glyph id, weighted higher during generation. */
  dominant: string
  secondary?: string[]
  /** Preferred motifs + weights (higher-level building blocks). */
  motifs: MotifPreference[]
  /** Range, not a fixed number — the generator picks within it from the seed. */
  density: { min: number; max: number }
  motif?: FocalMotifId
}

export interface ColorSpec {
  strategy: "pairsFromPalette" | "duotone" | "monochrome" | "neonOnDark"
  background: string | "fromPalette"
  palette: string[]
  accent: string
}

export interface TextureSpec {
  surface: TextureId
  intensity: number
  vignette: boolean
}

export interface MotionSpec {
  easing: EasingId
  enter: EnterStyle
  stagger: number
  speed: number
  rhythm: "snappy" | "smooth" | "mechanical"
}

export interface CameraSpec {
  move: "none" | "pushIn" | "pushOut" | "pan" | "kenBurns" | "orbit" | "parallax"
  amount: number
}

// ── The grammar object itself ────────────────────────────────────────────────

export interface StyleSpec {
  id: string
  label: string
  typography: TypographySpec
  layout: LayoutSpec
  spacing: SpacingSpec
  visualLanguage: VisualLanguageSpec
  color: ColorSpec
  texture: TextureSpec
  motion: MotionSpec
  camera: CameraSpec
  effects: EffectSpec[]
}

/** Recursive partial — the shape of per-render overrides passed to resolveStyle. */
export type DeepPartial<T> = T extends (infer U)[]
  ? U[] // arrays are replaced wholesale, not deep-merged
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

export type StyleOverrides = DeepPartial<StyleSpec>
