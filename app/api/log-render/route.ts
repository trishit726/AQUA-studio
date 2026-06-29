import { NextResponse } from "next/server"
import { recordRender } from "@/app/lib/db"
import { metric } from "@/lib/metrics"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const { userId, composition, durationSec, status } = await req.json()

  if (!userId || !composition || durationSec === undefined || !status) {
    return NextResponse.json(
      {
        error:
          "Missing required parameters: userId, composition, durationSec, status",
      },
      { status: 400 },
    )
  }

  try {
    const event = await recordRender({
      userId,
      composition,
      durationSec: Number(durationSec),
      status,
    })
    const ok = status === "completed" || status === "success"
    metric(ok ? "RenderCompleted" : "RenderFailed", 1, "Count", { composition })
    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    metric("Errors", 1, "Count", { op: "recordRender" })
    console.error("[v0] Error recording render to DynamoDB:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
