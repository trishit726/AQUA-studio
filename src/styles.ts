// ────────────────────────────────────────────────────────────────────────────
// STYLE PRESETS — this is how you "follow an art style".
//
// A style is not just colors. It's color + typography + MOTION FEEL + spacing,
// captured as concrete values. Add a new preset here and any composition that
// reads STYLES can wear it. Switch styles by changing one string.
// ────────────────────────────────────────────────────────────────────────────
import { Easing } from "remotion";
import { loadFont as loadMincho } from "@remotion/google-fonts/ShipporiMincho";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";

// Each style loads its own font (Remotion blocks rendering until ready).
const mincho = loadMincho("normal", { weights: ["400", "500"], subsets: ["latin"] });
const fraunces = loadFraunces("normal", { weights: ["400", "600"], subsets: ["latin"] });

export type RevealStyle = {
  label: string;
  // Color
  bg: string;
  text: string;
  accent: string;
  muted: string;
  // Typography
  fontFamily: string;
  fontWeight: number;
  fontSize: number; // smaller = more negative space
  letterSpacing: number;
  taglineSize: number;
  taglineSpacing: number;
  taglineItalic: boolean;
  // Motion feel
  staggerFrames: number; // gap between each letter
  riseY: number; // how far letters travel up into place
  blurAmount: number; // start blur on each letter (0 = crisp)
  springDamping: number; // high = no bounce, calm
  entranceEase: (n: number) => number;
  exitEase: (n: number) => number;
  // Atmosphere
  glow: number; // 0 = none; soft warm halo strength
  seal: boolean; // a hanko-style accent mark (Japanese)
  lineWidth: number; // hairline under the name
};

export const STYLES = {
  // 🇯🇵 Restraint & negative space. Washi paper, sumi ink, one vermilion accent.
  // Slow, deliberate motion (ma — the pause matters). No bounce, no glow.
  japanese: {
    label: "Japanese minimal",
    bg: "#e9e5db",
    text: "#211f19",
    accent: "#b3402b", // 朱 vermilion
    muted: "#6f6a5f",
    fontFamily: mincho.fontFamily,
    fontWeight: 500,
    fontSize: 150,
    letterSpacing: 18,
    taglineSize: 28,
    taglineSpacing: 12,
    taglineItalic: false,
    staggerFrames: 8,
    riseY: 22,
    blurAmount: 7,
    springDamping: 200,
    entranceEase: Easing.inOut(Easing.cubic),
    exitEase: Easing.inOut(Easing.cubic),
    glow: 0,
    seal: true,
    lineWidth: 200,
  },

  // 🟧 Warm, human, calm. Cream ground, clay-coral accent, soft serif.
  // Gentle ease-outs, medium pace, a low warm halo. Approachable.
  anthropic: {
    label: "Anthropic / Claude",
    bg: "#f0eee6",
    text: "#262521",
    accent: "#d97757", // clay / coral
    muted: "#6b6557",
    fontFamily: fraunces.fontFamily,
    fontWeight: 600,
    fontSize: 188,
    letterSpacing: 1,
    taglineSize: 34,
    taglineSpacing: 4,
    taglineItalic: true,
    staggerFrames: 5,
    riseY: 30,
    blurAmount: 14,
    springDamping: 200,
    entranceEase: Easing.out(Easing.cubic),
    exitEase: Easing.in(Easing.cubic),
    glow: 0.22,
    seal: false,
    lineWidth: 240,
  },
} satisfies Record<string, RevealStyle>;

export type StyleId = keyof typeof STYLES;
