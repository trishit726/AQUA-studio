import { NextResponse } from "next/server"
import { listRenders } from "@/app/lib/db"

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
    // Renders share the user's partition with their scenes and are isolated by
    // the "RENDER#" sort-key prefix — a single Query, newest first, no index.
    const renders = await listRenders(userId)
    return NextResponse.json(renders)
  } catch (error: any) {
    console.error("[v0] Error listing renders from DynamoDB:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
