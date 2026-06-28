// ────────────────────────────────────────────────────────────────────────────
// SHARED CANVAS SETTINGS — change these once and every composition follows.
//
// Want 4K? set CANVAS = QUAD_HD.   Want 60fps? set FPS = 60.
// Each composition in Root.tsx reads width/height/fps from here.
// ────────────────────────────────────────────────────────────────────────────

export const FPS = 30;

// Pick one (or define your own { width, height }).
export const FULL_HD = { width: 1920, height: 1080 } as const; // 1080p
export const QUAD_HD = { width: 2560, height: 1440 } as const; // 1440p
export const ULTRA_HD = { width: 3840, height: 2160 } as const; // 4K

// The resolution used by all compositions.
export const CANVAS = FULL_HD;

// Convenience: turn seconds into frames at the current FPS.
// e.g. durationInFrames={seconds(5)}
export const seconds = (s: number) => Math.round(s * FPS);

// A neutral, restrained palette. Override per-composition via props.
export const COLORS = {
  bg: "#0f1115",
  surface: "#1a1d24",
  text: "#f5f6f8",
  muted: "#9aa3b2",
  accent: "#5b8def",
} as const;

// Title-safe inset (~5% margin) so text never crowds the frame edges.
export const TITLE_SAFE_PADDING = "5%";
