// Public entry point for the Style Engine.
//
// Importing this module registers all built-in Style Packs (side effect) and
// re-exports the resolver, registries, and types. Modules that need a style
// should import from here so the packs are guaranteed registered.

// ── Register built-in packs (import for side effects) ───────────────────────
import "./packs/default"
import "./packs/swiss"
import "./packs/brutalist"
import "./packs/cyberHud"
import "./packs/japaneseEditorial"

export * from "./types"
export { resolveStyle, DEFAULT_STYLE_ID } from "./resolve"
export { loadStyleFont } from "./fonts"
export { resolveStack, type StyleStack, type StyleStackLayer } from "./stack"
export { intentToStack, designIntentDefaults, type DesignIntent } from "./intent"

import { styles as _styles } from "./registry"
/** Registered base style packs (id + label) for blend pickers. Excludes blends. */
export const listStylePacks = (): { id: string; label: string }[] =>
  _styles.ids().map((id) => ({ id, label: _styles.require(id).label }))
export {
  styles,
  layoutStrategies,
  geometryVocabs,
  focalMotifs,
  textures,
  effects,
  Registry,
} from "./registry"
export { DEFAULT_STYLE } from "./packs/default"
