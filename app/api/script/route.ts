import { NextResponse } from "next/server"
import { generateText } from "@/lib/server/ai"

export const runtime = "nodejs"

const SYSTEM_SCRIPT = `You are a scriptwriter for short product-demo and brand videos. Given a brand or topic, write a punchy spoken voiceover script for a 45-75 second video. Structure it as: a 1-line HOOK, a 1-2 line PROBLEM, a 2-3 line SOLUTION/what it does, and a 1-line CALL TO ACTION. Write plain narration the creator reads aloud (no stage directions, no headers unless they help). Keep it energetic, concrete, and under ~140 words.`

export async function POST(req: Request) {
  const { prompt } = (await req.json().catch(() => ({}))) as { prompt?: string }
  if (!prompt || !String(prompt).trim()) {
    return NextResponse.json(
      { error: "Missing required parameter: prompt" },
      { status: 400 },
    )
  }

  try {
    const script = (
      await generateText({
        system: SYSTEM_SCRIPT,
        user: `Brand / topic: ${String(prompt).trim()}`,
        maxTokens: 1200,
      })
    ).trim()

    return NextResponse.json({ script })
  } catch (error: any) {
    console.error("[v0] Error writing script:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
