// ─────────────────────────────────────────────────────────────────────────────
// resolveStyle — turn a style id (+ optional per-render overrides) into a fully
// concrete StyleSpec that every module reads. Overrides deep-merge onto the base
// pack; arrays are replaced wholesale (you set a whole palette/effect list, not
// merge into it), matching DeepPartial semantics.
// ─────────────────────────────────────────────────────────────────────────────
import type { StyleSpec, StyleOverrides } from "./types"
import { styles } from "./registry"

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) return base
  if (!isPlainObject(base) || !isPlainObject(override)) {
    // primitives and arrays: override wins wholesale
    return override as T
  }
  const out: Record<string, unknown> = { ...base }
  for (const key of Object.keys(override)) {
    out[key] = deepMerge((base as Record<string, unknown>)[key], override[key])
  }
  return out as T
}

/**
 * Resolve a style by id, applying overrides. Throws if the id isn't registered
 * (a clear failure beats silently rendering the wrong style).
 */
export function resolveStyle(id: string, overrides?: StyleOverrides): StyleSpec {
  const base = styles.require(id)
  if (!overrides) return base
  return deepMerge(base, overrides)
}

/** Convenience for the back-compat path and previews. */
export const DEFAULT_STYLE_ID = "default"
