import { NextResponse } from "next/server"
import { listScenes } from "@/app/lib/db"
import { metric } from "@/lib/metrics"
import { cacheStats } from "@/app/lib/cache"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json(
      { error: "Missing required query parameter: userId" },
      { status: 400 },
    )
  }

  try {
    // Single-partition Query over the sparse GSI1 (recency order). No Scan
    // fallback by design — see app/lib/db.ts for the access-pattern map.
    const start = Date.now()
    const scenes = await listScenes(userId)
    const stats = cacheStats()
    metric("ScenesListed", 1, "Count", { count: scenes.length })
    metric("ScenesListedMs", Date.now() - start, "Milliseconds", {
      cacheHits: stats.hits,
      cacheMisses: stats.misses,
    })
    return NextResponse.json(scenes)
  } catch (error: any) {
    metric("Errors", 1, "Count", { op: "listScenes" })
    console.error("[v0] Error listing scenes from DynamoDB:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
