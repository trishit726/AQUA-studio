import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { uploadObject, STORAGE_ENABLED } from "@/lib/server/storage"
import { metric } from "@/lib/metrics"

export const runtime = "nodejs"

// Cap the decoded image at 8 MB — keeps a single request cheap and well under
// any item/payload limit. (The image never goes into DynamoDB; only its URL does.)
const MAX_BYTES = 8 * 1024 * 1024

/**
 * Upload a user's background image to S3 and return a durable URL.
 *
 * The client posts a data URL; we decode it to a buffer and store it under
 * uploads/<uuid>. The returned URL is what gets persisted in the scene's props
 * (instead of an ephemeral blob: URL), so the image survives save/reload.
 *
 * Returns 501 when object storage isn't configured — the client then keeps its
 * local blob URL, exactly the previous behaviour, so nothing breaks without S3.
 */
export async function POST(req: Request) {
  if (!STORAGE_ENABLED) {
    return NextResponse.json(
      { error: "Object storage not configured" },
      { status: 501 },
    )
  }

  try {
    const { dataUrl, ext } = (await req.json()) as {
      dataUrl?: string
      ext?: string
    }
    const match =
      typeof dataUrl === "string" && dataUrl.match(/^data:(.+?);base64,(.*)$/s)
    if (!match) {
      return NextResponse.json(
        { error: "Expected a base64 data URL in `dataUrl`" },
        { status: 400 },
      )
    }

    const contentType = match[1]
    const buffer = Buffer.from(match[2], "base64")
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json(
        { error: `Image exceeds ${MAX_BYTES / (1024 * 1024)}MB limit` },
        { status: 413 },
      )
    }

    const safeExt = (ext || contentType.split("/")[1] || "bin").replace(
      /[^a-z0-9]/gi,
      "",
    )
    const key = `uploads/${randomUUID()}.${safeExt}`
    const url = await uploadObject(key, buffer, contentType)

    metric("ImageUploaded", 1, "Count", { bytes: buffer.length })
    return NextResponse.json({ url })
  } catch (error: any) {
    metric("Errors", 1, "Count", { op: "upload" })
    console.error("[v0] Error uploading image to S3:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
