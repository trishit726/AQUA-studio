import { NextResponse } from "next/server"
import { deleteScene } from "@/app/lib/db"

export const runtime = "nodejs"

async function handleDelete(id: string | null, userId: string | null) {
  if (!id || !userId) {
    return NextResponse.json(
      { error: "Missing required parameters: id, userId" },
      { status: 400 },
    )
  }

  try {
    // Single conditional DeleteItem: the attribute_exists(PK) guard means a
    // caller can only delete an item that exists inside their own partition,
    // so ownership is enforced without a separate read-then-check round trip.
    const deleted = await deleteScene(userId, id)

    if (!deleted) {
      return NextResponse.json(
        { error: "Scene not found or not owned by you" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting scene from DynamoDB:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  return handleDelete(searchParams.get("id"), searchParams.get("userId"))
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  return handleDelete(body?.id ?? null, body?.userId ?? null)
}
