// ─────────────────────────────────────────────────────────────────────────────
// Font registry — maps a StyleSpec FontRef (googleFont name) to a loaded font
// family. @remotion/google-fonts requires a static import per family, so each
// supported font is statically imported here and keyed by name. Adding a font
// for a new Style Pack = one import + one map entry (no renderer change).
//
// Results are cached, and loadFont() is itself idempotent, so calling this at
// module scope or in a component body is safe and matches the current behaviour
// (PatternTitle loaded Anton at module scope).
// ─────────────────────────────────────────────────────────────────────────────
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton"
import { loadFont as loadShippori } from "@remotion/google-fonts/ShipporiMincho"
import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack"
import { loadFont as loadInter } from "@remotion/google-fonts/Inter"
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono"
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk"
import type { FontRef } from "./types"

type Loader = (
  style?: string,
  opts?: { weights?: string[]; subsets?: string[] },
) => { fontFamily: string }

// Registered families. Extend this for new packs (Swiss → Archivo, HUD → a mono…).
const LOADERS: Record<string, Loader> = {
  Anton: loadAnton as Loader,
  ShipporiMincho: loadShippori as Loader,
  ArchivoBlack: loadArchivoBlack as Loader,
  Inter: loadInter as Loader,
  SpaceMono: loadSpaceMono as Loader,
  SpaceGrotesk: loadSpaceGrotesk as Loader,
}

const cache = new Map<string, string>()

/**
 * Resolve a FontRef to a CSS font-family string, loading it on first use.
 * Falls back to the ref's `fallback` (or a sans stack) for an unregistered font
 * rather than throwing — a missing font should degrade, not crash a render.
 */
export function loadStyleFont(ref: FontRef): string {
  const key = `${ref.googleFont}:${ref.weights.join(",")}`
  const cached = cache.get(key)
  if (cached) return cached

  const loader = LOADERS[ref.googleFont]
  if (!loader) {
    const fam = ref.fallback ?? "sans-serif"
    cache.set(key, fam)
    return fam
  }

  const { fontFamily } = loader("normal", { weights: ref.weights, subsets: ["latin"] })
  cache.set(key, fontFamily)
  return fontFamily
}
