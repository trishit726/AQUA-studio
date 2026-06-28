# Aqua Studio — Style Engine Architecture Design Document (v2)

**Status:** Proposal. Phases 0–2 of the build are done (StyleSpec foundation + default-pack parity + Motion Engine/memoization); Phases 3+ are re-scoped by this v2.
**Goal:** Evolve the procedural pattern generator into a modular **procedural design-language engine** — every render belongs to a recognizable visual style yet is uniquely generated. Not a template system: everything is generated from rules + a seed.

### What changed in v2 (from review feedback)
1. **Style is ambient, not a pipeline stage.** `StyleSpec` is CSS-like — passed *into* every module, never a step between Composition and Motion.
2. **A Design Grammar layer sits above StyleSpec.** Reference images → **Design Grammar** (human-readable design rules) → **StyleSpec** (machine config). The spec is *compiled from* a grammar, not authored raw.
3. **Motifs replace flat "geometry."** Higher-level reusable building blocks (Diagonal Bar Cluster, Circle+Stamp, Radar Ring, Dimension Line) — not just circle/bar/dot.
4. **Layout becomes a grammar of primitives** (flow, anchors, hierarchy, alignment, whitespace, reading direction). Grid/radial/editorial are *implementations* of those primitives.
5. **Style Stacks** — the headline feature. Blend styles by weight (Swiss 70% / Brutalist 30%); the engine interpolates typography, spacing, color, motion, effects. This is what makes Aqua Studio categorically not a template tool.
6. **A semantic layer up front.** Prompt → **AI Design Intent** (mood, energy, industry, formality, density, motion intensity, color emotion, audience, brand personality) → **Style Resolver**. The AI reasons about *design*, not coordinates.

---

## 1. Where we are today

```
Prompt → AI (/generate) → PatternTitle props → PatternTitle.tsx renders everything
```

`PatternTitle.tsx` owns every visual decision; the rest of the look is hardcoded across two engine files. "Style" is **implicit and scattered**, so there's no way to say "make this Swiss" without editing the renderer.

| Concern | Where today | Hardcoded? |
|---|---|---|
| Typography | `PatternTitle.tsx` — Anton, ShipporiMincho | ✅ |
| Geometry | `engine.ts` / `PatternField.tsx` — 16 `AnimType` glyphs | ✅ one set |
| Layout / placement | `engine.ts` — proximity BFS + greedy grid fill | ✅ one strategy |
| Spacing / rhythm | `engine.ts` — `GRID_SIZE=20`, fixed square sizes | ✅ |
| Color | `engine.ts` — `pairsForColor()` | ✅ |
| Texture | `PatternTitle.tsx` — grain 0.1 + vignette | ✅ |
| Motion | `PatternField.tsx`, `AnimatedTitle` | ✅ |
| Camera | `PatternTitle.tsx` — `cameraTransform()` | parametric |
| Effects | `scatter` bool, `FloodField` | ✅ bolted on |

Two facts the refactor builds on:
1. **Determinism** — seeded `mulberry32` makes placement reproducible. We keep this end-to-end (preview == MP4 == alpha).
2. **Generation is frame-independent** — already moved out of the per-frame path (Phase 2 memoization). The Motion Engine applies cheap per-frame transforms to pre-generated objects.

---

## 2. The layered model

There are **three derivation layers** feeding one **resolved `StyleSpec`**, which is then **ambient** to a pipeline of generators + a renderer.

### 2.1 Semantic layer — Prompt → Design Intent
The AI no longer emits coordinates. It emits *design intent* — what the piece should feel like:

```jsonc
// Prompt: "Launching our AI platform"
{
  "mood": "bold",
  "energy": "high",
  "industry": "technology",
  "formality": "low",
  "visualDensity": "minimal",
  "motionIntensity": "aggressive",
  "colorEmotion": "high-contrast",
  "audience": "developers",
  "brandPersonality": ["confident", "futuristic"],
  "hierarchy": "headline-heavy",
  "keywords": ["AI", "future", "launch"]
}
```

### 2.2 Resolution layer — Design Intent → Style Resolver → StyleSpec
The **Style Resolver** maps intent → a **Style Stack** (weighted set of Design Grammars) → one resolved `StyleSpec`. "High energy + technology + aggressive motion" might resolve to *Cyber 70% / Swiss 30%*. The user can also set the stack by hand.

### 2.3 Authoring layer — Reference Images → Design Grammar → StyleSpec
Styles are authored as **Design Grammars** (human-readable rules extracted from references), which **compile** to a `StyleSpec`. We never go image→spec directly; the grammar is the reviewable, editable middle.

```
Reference Images ──► Design Grammar ──► StyleSpec ─┐
                                                   ├─► (resolved, possibly blended)
Prompt ──► Design Intent ──► Style Resolver ───────┘
```

### 2.4 The pipeline — Style is ambient (CSS-like)
`StyleSpec` is **not** a stage between modules. It is passed **into** every module, the way CSS cascades into every element:

```
        Prompt
          │
          ▼
   AI Design Intent
          │
          ▼
    Style Resolver ──► resolves a Style Stack ──► ┌──────────────────────────┐
          │                                       │  StyleSpec  (ambient)    │
          ▼                                       │  read by EVERY module ▼  │
  ┌───────────────┐   ┌───────────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │  Composition  │──►│    Pattern    │──►│    Layout    │──►│  Motion  │──►│ Effects  │──►│ Renderer │
  │   Generator   │   │   Generator   │   │    Engine    │   │  Engine  │   │  Engine  │   │          │
  └───────────────┘   └───────────────┘   └──────────────┘   └──────────┘   └──────────┘   └──────────┘
          ▲                   ▲                   ▲                ▲              ▲              ▲
          └───────────────────┴───────────────────┴── StyleSpec ──┴──────────────┴──────────────┘
```

Data flows left→right (Content → Composition → … → pixels). `StyleSpec` flows **downward into all of them**. No module branches on a style *id*; each only reads spec fields + resolves strategy ids from registries.

---

## 3. Design Intent (semantic layer schema)

```ts
interface DesignIntent {
  mood: "bold" | "calm" | "playful" | "serious" | "elegant" | "raw"
  energy: "low" | "medium" | "high"
  industry: string                 // "technology" | "fashion" | "finance" | …
  formality: "low" | "medium" | "high"
  visualDensity: "minimal" | "balanced" | "dense"
  motionIntensity: "still" | "subtle" | "aggressive"
  colorEmotion: "muted" | "warm" | "cool" | "high-contrast" | "monochrome"
  audience: string
  brandPersonality: string[]
  hierarchy: "headline-heavy" | "balanced" | "text-heavy"
  keywords: string[]
}
```

The `/generate` endpoint returns this (plus the words). It's small, robust, and impossible to produce "off-brand coordinates" — the engine owns layout.

---

## 4. Design Grammar (the layer above StyleSpec)

A **Design Grammar** is the human-readable rule-set of a style, extracted from references. It is what a designer would *say* about the style, and it **compiles** to a `StyleSpec`.

```ts
interface DesignGrammar {
  id: string
  label: string

  // The defining rules, stated as design principles.
  hierarchy: HierarchyRule[]        // e.g. "headline huge", "labels tiny", "wide gap between"
  motifs: MotifRule[]               // which motifs, how prominent, where they cluster
  layout: LayoutGrammar             // see §6 — primitives, not "grid"
  rhythm: RhythmRule                // spacing cadence, whitespace philosophy
  color: ColorRule                  // role of accent, contrast level, palette mood
  texture: TextureRule
  motion: MotionRule                // pacing, easing feel, entrance philosophy

  compile(): StyleSpec              // deterministic grammar → spec
}
```

Example — **Swiss grammar** (extracted from your `swiss/` references):

```
hierarchy : headline HUGE  →  labels TINY  →  generous negative space
motifs    : diagonal-bar-cluster (dominant), thin-rule (secondary)
layout    : asymmetric grid · flush-left · top-left & lower-right anchors · L→R reading
rhythm    : sparse, large margins
color     : single hot accent (red) on white/black, flat, max contrast
texture   : none
motion    : snappy clip-wipes, hard cuts
```

`grammar.compile()` turns those rules into concrete `StyleSpec` fields (fonts, ranges, motif ids, easing). Editing the **grammar** is how you tune a style; the spec is generated.

---

## 5. The four styles as grammars (extraction, not copying)

Grammar extracted from your `NEW RFERNCE/` folder — the rules, not the pixels:

| Style | Hierarchy | Motifs | Layout | Color | Motion |
|---|---|---|---|---|---|
| **Swiss** | huge → tiny, big gaps | diagonal-bar-cluster, thin-rule | asymmetric grid, flush-left, rotated columns | hot accent on white/black, flat | snappy wipes |
| **Brutalist** | giant headline vs micro mono captions | concrete-plane, corner-tick | panel grid, corner-anchored, huge whitespace | monochrome, duotone photo | mechanical, cut/fade |
| **Cyber HUD** *(incl. glass)* | mono readouts, bracketed labels | radar-ring, hud-frame, glass-form, tick-cluster | radial/centered, orbit | neon-on-black, chrome/glass + bloom | drawOn, mechanical, orbit camera |
| **Japanese Editorial** | vertical CJK + ruby, refined | circle-stamp (hinomaru), seal-mark | vertical-rl, generous margins, centered focal | duotone red/black | slow, smooth fades |

Each style is **one Design Grammar** plus, where needed, **one new motif or layout module**. Everything else is config — the proof the architecture works.

---

## 6. Layout Grammar (primitives, not "grid")

Layout is decomposed into **grammar primitives**. `grid` / `radial` / `editorial` are *implementations* that set these primitives — they are not the vocabulary itself.

```ts
interface LayoutGrammar {
  flow: "stacked" | "scattered" | "columnar" | "orbital" | "freeform"
  anchorPoints: Anchor[]            // named regions content gravitates to (e.g. "top-left", "lower-right", "center")
  hierarchy: "single-focal" | "dual" | "even"   // how dominant the headline is
  alignment: "flush-left" | "centered" | "justified" | "optical"
  whitespace: "dense" | "balanced" | "generous"
  readingDirection: "ltr" | "rtl" | "vertical-rl"
}
```

A **Layout Engine** turns a `LayoutGrammar` + Content + seed into concrete regions/anchors. The `default` pack's grammar is `flow:"freeform"` with explicit anchors — i.e. today's exact "titles by (x,y)" behavior, expressed in the new vocabulary.

---

## 7. Motifs (higher-level building blocks)

The 16 glyphs were too low-level. A **Motif** is a reusable, parameterized composite — a *design idea*, not a shape.

```ts
interface Motif {
  id: string                        // "diagonalBarCluster" | "circleStamp" | "radarRing" | "dimensionLine"
  generate(region: Rect, style: StyleSpec, rng: RNG): GeneratedElement[]
  prominence: "dominant" | "accent" | "background"
}
```

- A motif may emit many primitives (a bar cluster = several rotated bars), so motifs *compose* the existing glyph primitives rather than replacing them.
- The current 16 shapes survive as **primitive glyphs** that motifs (and the legacy `patterngen16` scatter motif) draw from.
- Adding a motif = one module + registry entry; no renderer change.

---

## 8. Style Stack — blending (the headline feature)

A render's style is a **weighted stack**, not a single pick:

```ts
interface StyleStack {
  layers: { grammarId: string; weight: number }[]   // e.g. [{swiss,0.7},{brutalist,0.3}]
}
```

The **Style Resolver** blends the layers' compiled `StyleSpec`s into one, per a typed **interpolation policy**:

| Field kind | Blend rule |
|---|---|
| Numbers (tracking, density, stagger, intensity, margins) | weighted average |
| Colors / palettes | weighted color mix; accent from the dominant layer |
| Enums on a spectrum (whitespace, motionIntensity, formality) | map to ordinal, weighted-average, snap to nearest |
| Hard enums (reading direction, align) | dominant layer wins |
| Fonts (can't tween) | per *role*, the layer with the highest weight that defines that role |
| Motifs / effects | union, each kept with `prominence × layerWeight`; threshold drops weak ones |
| Easing / rhythm | dominant layer; secondary may contribute an effect overlay |

This is what makes Aqua Studio categorically different from template tools: *Blueprint 60% / Cyber 40%* is a real, generable visual identity that exists nowhere else. The editor exposes it as **weight sliders** over the stack.

---

## 9. Module contracts (each receives StyleSpec ambiently)

| Module | Reads from `StyleSpec` | Produces |
|---|---|---|
| **Composition Generator** | layout grammar, hierarchy, motif placement | `Composition` (regions, focal motifs, free areas) |
| **Pattern Generator** | motifs, density, color, rhythm | `Placement` (elements via motifs) |
| **Layout Engine** | layout grammar (flow/anchors/align/whitespace/reading) | resolved positions for titles + regions |
| **Motion Engine** | motion (easing/enter/stagger/rhythm/speed) | per-frame `{transform, opacity, clip}` |
| **Effects Engine** | `effects[]` (scatter/fold/flood/explode/dissolve/morph/wave) | element modifiers + overlay layers |
| **Renderer** | typography, color.background, texture, camera | the final Remotion tree |

The Renderer stays **thin and style-agnostic** — no `Anton`, no grain constant, no `if (style === …)`. Strategy ids resolve through registries.

---

## 10. Integration & incremental plan (nothing breaks)

Strangler pattern: wrap the monolith, redirect one decision at a time to the ambient spec, delete the old constant once parity is verified. The `default` grammar reproduces today's look **pixel-for-pixel**.

| Phase | What | State |
|---|---|---|
| **0** | `StyleSpec` types + `default` pack (today's values) | ✅ done |
| **1** | `PatternTitle` reads font + texture from `resolveStyle("default")` | ✅ done (parity) |
| **2** | Motion Engine extracted; placement memoized out of per-frame path | ✅ done |
| **3** | **Motifs** layer: generalize Pattern Generator to draw via motifs (default = `patterngen16` scatter motif) | next |
| **4** | **Layout Engine** + Layout Grammar primitives (default = freeform) + Composition Generator | |
| **5** | Author the 4 **Design Grammars** + new motifs (diagonal-bar, hinomaru, radar-ring) + vertical-CJK/ruby renderer | |
| **6** | **Style Stack** blending + **Design Intent** AI output + Style Resolver | |
| **7** | Editor: full `StyleSpec` controls + Style-Stack weight sliders + Design-Intent quick mode | |

Back-compat: existing `PatternTitle` props map to `{ Content, StyleStack([default]) }` via an adapter; saved DynamoDB scenes load unchanged; new scenes store `{ intent?, stack, params, seed }`.

---

## 11. File map (revised for v2)

**Done (`src/style/`, `src/engine/`):** `types.ts`, `registry.ts`, `resolve.ts`, `fonts.ts`, `packs/default.ts`, `index.ts`, `engine/motion.ts`.

**New:**
```
src/style/intent.ts                 DesignIntent schema + resolver helpers
src/style/grammar/types.ts          DesignGrammar + compile() contract
src/style/grammar/swiss.ts          the four grammars
src/style/grammar/brutalist.ts
src/style/grammar/cyberHud.ts       (incl. glass)
src/style/grammar/japaneseEditorial.ts
src/style/stack.ts                  StyleStack + blend/interpolation policy
src/style/resolver.ts               DesignIntent → StyleStack → resolved StyleSpec
src/engine/composition.ts           Composition Generator
src/engine/layout/                  Layout Engine + flow/anchor/align implementations
src/engine/pattern.ts               motif-driven Pattern Generator (wraps engine.ts)
src/engine/motifs/                  diagonalBarCluster, circleStamp, radarRing, dimensionLine, patterngen16
src/engine/effects/                 scatter, fold, flood, explode, dissolve, morph, wave
src/style/strategies/texture/       grain, paper, noise, glass, blueprint
```

**Modified:** `engine.ts` → the `patterngen16` motif + placement primitive; `PatternField.tsx` → motif-driven render; `PatternTitle.tsx` → thin style-agnostic Renderer + back-compat adapter; `server/render-server.mjs /generate` → emit `DesignIntent`; `components/editor/*` → intent + stack + full-spec controls; `app/lib/db.ts` → scene stores `{ intent, stack, params }`.

---

## 12. Performance

1. **Generate once, animate per frame** — done (Phase 2 memoization). Resolver + grammar compile + composition are also memoized per `(content, stack, params, seed)`.
2. **Blend is cheap** — interpolating a handful of scalar/color fields per render, not per frame.
3. **Cap motif element counts** per style via density ranges so a heavy stack can't tank preview.
4. **Textures declarative** — SVG/CSS/pre-baked; glass via `backdrop-filter` where possible.
5. **Determinism preserved** — one seed discipline; preview == MP4 == alpha, frame-exact.

---

## 13. Decisions (locked) & open questions

**Locked:** strict pixel-parity for `default`; glass lives in the Cyber HUD grammar; add fonts freely (registry); vertical CJK + ruby in Phase 5; editor exposes the **full** `StyleSpec` (plus, per v2, Style-Stack sliders + a Design-Intent quick mode).

**Open (v2):**
1. **Blend granularity** — blend at the *StyleSpec* level (simple, ship first) or at the *Design Grammar* level (richer, e.g. interleave motifs)? Recommend spec-level first, grammar-level later.
2. **Intent → stack mapping** — hand-authored rules, or let Claude pick the stack directly from intent? Recommend rules first (predictable), AI-suggested later.
3. **Motif portability** — should any motif be usable by any style (e.g. radar-ring in a Swiss stack), or are some motifs style-locked? Recommend fully portable — that's what makes stacks expressive.

---

## 14. Summary

v2 turns one hardcoded renderer into **a semantic front-end (Design Intent) → a resolver that blends Style Stacks → an ambient `StyleSpec` cascading into six independent modules**, with styles authored as reviewable **Design Grammars** built from **Motifs** and **Layout-Grammar primitives**. Style is CSS, not a function call. Stacks make every render a unique blend. Nothing breaks: the `default` grammar holds today's look pixel-for-pixel, and Phases 0–2 already ship.
