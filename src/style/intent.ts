// ─────────────────────────────────────────────────────────────────────────────
// Design Intent — the semantic layer. A DesignIntent describes what a piece
// should FEEL like; intentToStack() maps it, with DETERMINISTIC rules, to a
// Style Stack. (AI may later suggest/override the stack, but the mapping stays
// predictable and reproducible — the locked decision.)
// ─────────────────────────────────────────────────────────────────────────────
import type { StyleStack } from "./stack"

export interface DesignIntent {
  mood: "bold" | "calm" | "playful" | "serious" | "elegant" | "raw"
  energy: "low" | "medium" | "high"
  industry: string
  formality: "low" | "medium" | "high"
  visualDensity: "minimal" | "balanced" | "dense"
  motionIntensity: "still" | "subtle" | "aggressive"
  colorEmotion: "muted" | "warm" | "cool" | "high-contrast" | "monochrome"
}

export const designIntentDefaults: DesignIntent = {
  mood: "bold",
  energy: "high",
  industry: "technology",
  formality: "low",
  visualDensity: "minimal",
  motionIntensity: "aggressive",
  colorEmotion: "high-contrast",
}

const has = (s: string, ...opts: string[]) => opts.includes(s)

// Score each style's affinity for an intent. Pure + deterministic.
function scoreStyles(i: DesignIntent): Record<string, number> {
  const tech = /tech|software|ai|crypto|gaming|saas/i.test(i.industry)
  const editorial = /fashion|media|publishing|art|design|culture/i.test(i.industry)

  return {
    swiss:
      (has(i.mood, "bold", "serious") ? 2 : 0) +
      (i.formality === "high" ? 1.5 : 0) +
      (i.visualDensity === "minimal" ? 1.5 : 0) +
      (i.colorEmotion === "high-contrast" ? 1.5 : 0) +
      (editorial ? 1 : 0),
    brutalist:
      (has(i.mood, "raw", "serious") ? 2.5 : 0) +
      (i.formality === "high" ? 1 : 0) +
      (i.colorEmotion === "monochrome" ? 2 : 0) +
      (i.energy === "low" ? 1 : 0) +
      (i.motionIntensity === "still" ? 1 : 0),
    cyberHud:
      (tech ? 2.5 : 0) +
      (i.energy === "high" ? 1.5 : 0) +
      (i.motionIntensity === "aggressive" ? 1.5 : 0) +
      (has(i.mood, "bold", "playful") ? 1 : 0) +
      (has(i.colorEmotion, "high-contrast", "cool") ? 1 : 0),
    japaneseEditorial:
      (has(i.mood, "elegant", "calm") ? 2.5 : 0) +
      (i.formality === "high" ? 1 : 0) +
      (has(i.visualDensity, "minimal", "balanced") ? 1 : 0) +
      (has(i.colorEmotion, "warm", "muted") ? 1.5 : 0) +
      (i.motionIntensity !== "aggressive" ? 0.5 : 0),
    default: 0.4, // gentle floor so there's always a fallback
  }
}

/** Map intent → a two-layer Style Stack (deterministic). */
export function intentToStack(intent: DesignIntent): StyleStack {
  const scores = scoreStyles(intent)
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const [first, second] = ranked
  // Primary always; secondary only if it's a meaningful contributor.
  if (!second || second[1] < first[1] * 0.4 || second[1] <= 0) {
    return { layers: [{ styleId: first[0], weight: 1 }] }
  }
  const sum = first[1] + second[1]
  return {
    layers: [
      { styleId: first[0], weight: Number((first[1] / sum).toFixed(2)) },
      { styleId: second[0], weight: Number((second[1] / sum).toFixed(2)) },
    ],
  }
}
