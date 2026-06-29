import { NextResponse } from "next/server"
import { getRenderProgress } from "@remotion/lambda/client"
import type { AwsRegion } from "@remotion/lambda/client"

export const runtime = "nodejs"

const REGION = (process.env.REMOTION_APP_REGION ||
  process.env.AWS_REGION ||
  "us-east-1") as AwsRegion
const FUNCTION_NAME = process.env.REMOTION_APP_FUNCTION_NAME

/**
 * Poll a Lambda render's progress. The client calls this every couple of seconds
 * with the { renderId, bucketName } handle until `done` is true, then reads
 * `outputUrl` (the public S3 URL of the finished MP4).
 */
export async function POST(req: Request) {
  if (!FUNCTION_NAME) {
    return NextResponse.json({ error: "Lambda render not configured" }, { status: 501 })
  }

  try {
    const { renderId, bucketName } = (await req.json()) as {
      renderId?: string
      bucketName?: string
    }
    if (!renderId || !bucketName) {
      return NextResponse.json(
        { error: "Missing `renderId` or `bucketName`" },
        { status: 400 },
      )
    }

    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: FUNCTION_NAME,
      region: REGION,
    })

    if (progress.fatalErrorEncountered) {
      return NextResponse.json(
        { error: progress.errors[0]?.message ?? "Lambda render failed" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      done: progress.done,
      overallProgress: progress.overallProgress,
      outputUrl: progress.outputFile, // public S3 URL when done
    })
  } catch (error: any) {
    console.error("[v0] Lambda render progress failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
