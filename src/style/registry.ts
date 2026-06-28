// ─────────────────────────────────────────────────────────────────────────────
// Registries — the indirection that makes the engine extensible by config.
//
// StyleSpec references strategies by id; the actual implementations register
// themselves here. The Composition Generator, Pattern Generator, Motion Engine,
// Effects Engine and Renderer resolve ids → implementations through these maps
// and NEVER hardcode a style id or branch on one.
//
// Adding a style that reuses existing strategies needs nothing here (it's a pure
// StyleSpec). Adding a style with a genuinely new motif registers one new entry
// — no renderer change.
// ─────────────────────────────────────────────────────────────────────────────
import type { StyleSpec } from "./types"

/** A minimal typed key→value registry with last-write-wins registration. */
export class Registry<T> {
  private readonly map = new Map<string, T>()

  constructor(private readonly kind: string) {}

  register(id: string, value: T): void {
    this.map.set(id, value)
  }

  get(id: string): T | undefined {
    return this.map.get(id)
  }

  /** Like get(), but throws if missing — use where a strategy is required. */
  require(id: string): T {
    const v = this.map.get(id)
    if (v === undefined) {
      throw new Error(`[style] no ${this.kind} registered for id "${id}"`)
    }
    return v
  }

  has(id: string): boolean {
    return this.map.has(id)
  }

  ids(): string[] {
    return [...this.map.keys()]
  }
}

// Strategy registries. Implementation TYPES are intentionally `unknown` for now
// (Phase 0). Each strategy family will narrow its own signature when introduced
// in later phases (layout in Phase 4, geometry in Phase 3, texture/effects as
// they land), without changing this file's contract.
export const layoutStrategies = new Registry<unknown>("layout strategy")
export const geometryVocabs = new Registry<unknown>("geometry vocabulary")
export const focalMotifs = new Registry<unknown>("focal motif")
export const textures = new Registry<unknown>("texture")
export const effects = new Registry<unknown>("effect")

// The Style Pack registry: maps a style id → its StyleSpec.
export const styles = new Registry<StyleSpec>("style pack")
