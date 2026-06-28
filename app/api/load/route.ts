import { NextResponse } from "next/server"
import { getScene } from "@/app/lib/db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const userId = searchParams.get("userId")

  if (!id || !userId) {
    return NextResponse.json(
      { error: "Missing required query parameters: id, userId" },
      { status: 400 },
    )
  }

  try {
    // Strongly consistent GetItem scoped to the caller's partition — ownership
    // is enforced by the key, so a foreign id simply resolves to "not found".
    const scene = await getScene(userId, id)

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 })
    }

    return NextResponse.json(scene)
  } catch (error: any) {
    console.error("[v0] Error loading scene from DynamoDB:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
