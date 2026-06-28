import { NextResponse } from "next/server"
import { generateText } from "@/lib/server/ai"
import { metric } from "@/lib/metrics"

export const runtime = "nodejs"

const SHAPE_IDS = [
  "arrowUp", "capsuleDiag", "capsuleH", "plug", "hBars", "barsII", "circle",
  "target", "squares4", "xCross", "dotGrid", "dots3", "dice5", "dice2", "nested", "stripes",
]

const SYSTEM_GENERATE = `You are a senior brand and motion designer working inside "Aqua Studio", a tool that turns a one-line brand description into a bold animated title card: heavy condensed UPPERCASE caps inside a vivid colored block, with small geometric shapes scattered around it on a dark background.

Given a short description of a brand, product, topic, or event, design ONE striking title card and return it as a single JSON object with EXACTLY these fields:

{
  "titles": [
    { "kind": "block", "text": "TWO\\nWORDS", "x": 0.36, "y": 0.46, "size": 130 },
    { "kind": "label", "text": "A SHORT TAGLINE", "x": 0.36, "y": 0.61, "size": 30 }
  ],
  "accent": "#e0573a",
  "bgColor": "#2b2b2b",
  "colors": ["#6fa5a9", "#cf9f4a", "#e0573a"],
  "density": 11,
  "proximity": 11,
  "seed": 7,
  "shapes": ["circle", "target", "xCross", "dots3", "squares4", "stripes"]
}

Rules:
- titles: exactly one main "block" (the punchy title, 1-3 words, UPPERCASE, use \\n to split two lines), plus optionally one "label" (a short uppercase tagline) and/or one "jp" (a SHORT vertical Japanese accent — ONLY if the brand is genuinely Japan-related; otherwise omit it).
- x, y are fractions 0..1 of a 1920x1080 canvas. Keep the block centered-left (x ~0.34-0.46) and vertically centered (y ~0.44-0.62). Put a label just below the block; put a jp accent to the right of it.
- size: block ~110-150, label ~26-34, jp ~36-44.
- accent must pop against bgColor. Choose a palette ("colors", 3-6 hex) that evokes the brand's mood.
- density is 8-12 (how many shapes). proximity is 2-4 (keep shapes clustered tightly AROUND the title — higher values scatter them across the whole frame and look cluttered, so stay low). seed is any integer.
- shapes: 6-12 ids chosen ONLY from: ${SHAPE_IDS.join(", ")}.
- Respond with ONLY the JSON object — no prose, no markdown, no code fences.`

const clampNum = (v: any, lo: number, hi: number, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback
}
const isHex = (s: string) => typeof s === "string" && /^#?[0-9a-fA-F]{3,8}$/.test(s.trim())
const normHex = (s: string, fallback?: string) =>
  isHex(s) ? (s.trim().startsWith("#") ? s.trim() : "#" + s.trim()) : (fallback as string)

const parseJson = (text: string) => {
  let t = String(text).trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const start = t.indexOf("{"),
    end = t.lastIndexOf("}")
  if (start >= 0 && end > start) t = t.slice(start, end + 1)
  return JSON.parse(t)
}

export async function POST(req: Request) {
  const { prompt } = (await req.json().catch(() => ({}))) as { prompt?: string }
  if (!prompt || !String(prompt).trim()) {
    return NextResponse.json(
      { error: "Missing required parameter: prompt" },
      { status: 400 },
    )
  }

  const start = Date.now()
  try {
    const text = await generateText({
      system: SYSTEM_GENERATE,
      user: `Brand / topic: ${String(prompt).trim()}`,
      maxTokens: 2000,
      json: true,
    })
    const raw = parseJson(text)
    metric("AiGenerateMs", Date.now() - start, "Milliseconds")

    const kinds = new Set(["block", "label", "jp"])
    const titles = (Array.isArray(raw.titles) ? raw.titles : [])
      .filter((t: any) => t && kinds.has(t.kind) && typeof t.text === "string" && t.text.trim())
      .slice(0, 4)
      .map((t: any) => ({
        kind: t.kind,
        text: String(t.text).slice(0, 80),
        x: clampNum(t.x, 0, 1, 0.4),
        y: clampNum(t.y, 0, 1, 0.5),
        size: clampNum(t.size, 8, 400, t.kind === "block" ? 130 : t.kind === "label" ? 30 : 40),
      }))
    if (!titles.length) {
      titles.push({ kind: "block", text: "UNTITLED", x: 0.4, y: 0.5, size: 130 })
    }

    const colors = (Array.isArray(raw.colors) ? raw.colors : [])
      .filter(isHex)
      .map((c: string) => normHex(c))
      .slice(0, 6)
    const shapes = (Array.isArray(raw.shapes) ? raw.shapes : []).filter((s: string) =>
      SHAPE_IDS.includes(s),
    )

    return NextResponse.json({
      titles,
      accent: normHex(raw.accent, "#e0573a"),
      bgColor: normHex(raw.bgColor, "#2b2b2b"),
      colors: colors.length ? colors : ["#6fa5a9", "#cf9f4a", "#e0573a", "#000000", "#ffffff"],
      density: Math.round(clampNum(raw.density, 1, 20, 11)),
      proximity: Math.round(clampNum(raw.proximity, 1, 20, 11)),
      seed: Math.round(clampNum(raw.seed, 0, 1e9, Math.floor(Date.now() % 1e9))),
      shapes: shapes.length ? shapes : SHAPE_IDS,
    })
  } catch (error: any) {
    metric("Errors", 1, "Count", { op: "aiGenerate" })
    console.error("[v0] Error generating AI brand:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
