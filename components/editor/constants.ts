import type { TitleItem, PatternTitleProps } from "@/src/compositions/PatternTitle"

export const MUSIC = "music/lofi.mp3" // CC0 lo-fi bed (HoliznaCC0) in public/music/

export type CompId =
  | "PatternTitle"
  | "SwissPoster"
  | "Timeline"
  | "Assembly"
  | "Intro"
  | "FourCardsGrid"

export const COMP_LABELS: { id: CompId; label: string; hint: string }[] = [
  { id: "PatternTitle", label: "Pattern Title", hint: "Single procedural title card" },
  { id: "SwissPoster", label: "Swiss Poster", hint: "Armature · crossing axes" },
]

// The external Remotion render server (separate node process — `npm run server`).
// In production set NEXT_PUBLIC_RENDER_SERVER to a deployed render box (a
// long-running container — NOT a Vercel function; see README "Why render needs
// its own server"). Falls back to localhost for local dev.
export const SERVER = (
  process.env.NEXT_PUBLIC_RENDER_SERVER || "http://localhost:3001"
).replace(/\/$/, "")

// When "true", the editor renders via AWS Lambda (Remotion) — works on the
// deployed site with no local server. Set in Vercel after deploying the Lambda
// function + site (see LAMBDA-SETUP.md). Falls back to the local render server
// (SERVER above) when unset.
export const LAMBDA_RENDER = process.env.NEXT_PUBLIC_LAMBDA_RENDER === "true"

// Default brand palette + black/white — the preset "COLOR SET".
export const PALETTE = ["#6fa5a9", "#93ab5a", "#cf9f4a", "#e0573a", "#000000", "#ffffff"]

export const RATIOS = ["16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "9:16"]

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export const fileToDataURL = (f: File) =>
  new Promise<string>((res) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.readAsDataURL(f)
  })

export const newTitle = (kind: TitleItem["kind"]): TitleItem => ({
  id: `t${Date.now()}`,
  kind,
  text: kind === "jp" ? "テキスト" : kind === "label" ? "SUB LABEL" : "TITLE",
  x: 0.5,
  y: 0.5,
  size: kind === "block" ? 130 : kind === "label" ? 30 : 40,
})

export const CONFORMITY_TEMPLATES: { name: string; props: Partial<PatternTitleProps> }[] = [
  {
    name: "Conformity Hero",
    props: {
      titles: [
        { id: "c1", kind: "block", text: "CONFORMITY", x: 0.36, y: 0.46, size: 130 },
        { id: "c2", kind: "label", text: "SPEC-TO-CODE DRIFT GATE", x: 0.36, y: 0.61, size: 30 },
      ],
      bgColor: "#0b0e14",
      accent: "#ff4a4a",
      colors: ["#3cd070", "#ff4a4a", "#2c3e50", "#5f7e96", "#ffffff"],
      density: 12,
      proximity: 3,
      seed: 42,
      stagger: 3,
      showGrid: true,
      intro: "flood",
      floodStyle: "sweep",
      floodSpeed: 6,
      floodSolid: false,
      cameraMove: "pushIn",
      cameraAmount: 4,
      titleAnim: "wipe",
      underline: false,
      scatter: true,
      paint: 50,
      bgImage: "",
      music: "",
      sfx: false,
      audioReactive: false,
    },
  },
  {
    name: "Conformity Blocked",
    props: {
      titles: [
        { id: "c3", kind: "block", text: "MERGE\nBLOCKED.", x: 0.36, y: 0.46, size: 130 },
        { id: "c4", kind: "label", text: "2 CONTRACT VIOLATIONS DETECTED", x: 0.36, y: 0.61, size: 30 },
      ],
      bgColor: "#0b0e14",
      accent: "#ff4a4a",
      colors: ["#ff4a4a", "#111111", "#333333", "#ffffff"],
      density: 10,
      proximity: 2,
      seed: 99,
      stagger: 2,
      showGrid: true,
      intro: "flood",
      floodStyle: "radial",
      floodSpeed: 5,
      floodSolid: false,
      cameraMove: "pan",
      cameraDir: "down",
      cameraAmount: 3,
      titleAnim: "perLetter",
      underline: false,
      scatter: true,
      paint: 50,
      bgImage: "",
      music: "",
      sfx: false,
      audioReactive: false,
    },
  },
  {
    name: "Conformity Success",
    props: {
      titles: [
        { id: "c5", kind: "block", text: "CODE\nMATCHED.", x: 0.36, y: 0.46, size: 130 },
        { id: "c6", kind: "label", text: "CONTRACT VERIFIED • MERGE MAY PROCEED", x: 0.36, y: 0.61, size: 30 },
      ],
      bgColor: "#0b0e14",
      accent: "#3cd070",
      colors: ["#3cd070", "#111111", "#222222", "#ffffff"],
      density: 10,
      proximity: 2,
      seed: 88,
      stagger: 2,
      showGrid: true,
      intro: "flood",
      floodStyle: "sweep",
      floodSpeed: 5,
      floodSolid: false,
      cameraMove: "pushIn",
      cameraAmount: 3,
      titleAnim: "wipe",
      underline: false,
      scatter: true,
      paint: 50,
      bgImage: "",
      music: "",
      sfx: false,
      audioReactive: false,
    },
  },
]
