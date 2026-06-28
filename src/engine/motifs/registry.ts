// Typed registry of motifs. A motif registers itself by id; the Pattern
// Generator resolves a style's preferred motif ids to implementations here.
// Reuses the generic Registry from the Style Engine.
import { Registry } from "../../style/registry"
import type { Motif } from "./types"

export const motifRegistry = new Registry<Motif>("motif")
