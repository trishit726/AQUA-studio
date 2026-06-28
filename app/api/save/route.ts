import { NextResponse } from "next/server"
import { saveScene } from "@/app/lib/db"
import { metric } from "@/lib/metrics"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { id, name, props, duration, userId, template } = await req.json()

    if (!id || !name || !props || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, props, userId" },
        { status: 400 },
      )
    }

    const item = await saveScene({
      id,
      userId,
      // Existing PatternTitle editor omits `template`; default keeps it working.
      template: typeof template === "string" && template ? template : "PatternTitle",
      name,
      props,
      duration: duration || 150,
    })

    metric("SceneSaved", 1, "Count", { template: item.template })
    return NextResponse.json({ success: true, item })
  } catch (error: any) {
    metric("Errors", 1, "Count", { op: "saveScene" })
    console.error("[v0] Error saving scene to DynamoDB:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
