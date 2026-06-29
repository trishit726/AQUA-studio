import { NextResponse } from "next/server"
import { renderMediaOnLambda } from "@remotion/lambda/client"
import type { AwsRegion } from "@remotion/lambda/client"
import { metric } from "@/lib/metrics"

export const runtime = "nodejs"
// The trigger returns immediately (rendering continues on Lambda), so this stays
// a fast function — no long-running Vercel execution.
export const maxDuration = 60

const REGION = (process.env.REMOTION_APP_REGION ||
  process.env.AWS_REGION ||
  "us-east-1") as AwsRegion
const FUNCTION_NAME = process.env.REMOTION_APP_FUNCTION_NAME
const SERVE_URL = process.env.REMOTION_APP_SERVE_URL

/** True when the Remotion Lambda function + site are configured (deployed). */
export const LAMBDA_ENABLED = Boolean(FUNCTION_NAME && SERVE_URL)

/**
 * Kick off a serverless render on AWS Lambda (Remotion). The render runs on
 * Lambda and writes the MP4 to Remotion's S3 bucket; we return the handle the
 * client polls with (see ./progress). Env-gated: 501 when Lambda isn't
 * deployed, so the app cleanly falls back to the local render server.
 */
export async function POST(req: Request) {
  if (!FUNCTION_NAME || !SERVE_URL) {
    return NextResponse.json(
      { error: "Lambda render not configured (set REMOTION_APP_FUNCTION_NAME + REMOTION_APP_SERVE_URL)" },
      { status: 501 },
    )
  }

  try {
    const { composition, inputProps } = (await req.json()) as {
      composition?: string
      inputProps?: Record<string, unknown>
    }
    if (!composition) {
      return NextResponse.json({ error: "Missing `composition`" }, { status: 400 })
    }

    const { renderId, bucketName } = await renderMediaOnLambda({
      region: REGION,
      functionName: FUNCTION_NAME,
      serveUrl: SERVE_URL,
      composition,
      inputProps: inputProps ?? {},
      codec: "h264",
      // Public so the browser can fetch the finished file directly from S3.
      privacy: "public",
      downloadBehavior: { type: "download", fileName: `${composition}.mp4` },
    })

    metric("LambdaRenderStarted", 1, "Count", { composition })
    return NextResponse.json({ renderId, bucketName, region: REGION })
  } catch (error: any) {
    metric("Errors", 1, "Count", { op: "lambdaRender" })
    console.error("[v0] Lambda render trigger failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
