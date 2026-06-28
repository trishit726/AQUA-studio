// Registry of Style-Engine compositions exposed in the web editor. Each is a
// self-contained procedural style (driven by its StyleSpec + Layout Engine +
// motifs). The editor renders/edits them generically from this map.
import { SwissPoster, swissPosterDefaults, SWISS_POSTER_DURATION } from "@/src/compositions/SwissPoster"

export interface StyleCompEntry {
  component: React.FC<any>
  defaults: Record<string, any>
  width: number
  height: number
  durationInFrames: number
}

export const STYLE_COMPS: Record<string, StyleCompEntry> = {
  SwissPoster: { component: SwissPoster, defaults: swissPosterDefaults, width: 1920, height: 1080, durationInFrames: SWISS_POSTER_DURATION },
}

export const isStyleComp = (c: string): boolean => c in STYLE_COMPS
