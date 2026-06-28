// App-side object storage (Amazon S3 + CloudFront) — for user-uploaded assets
// such as background images. Mirrors server/lib/storage.mjs (render server),
// but lives in the Next.js API runtime.
//
// Env-gated on AWS_S3_BUCKET. When a bucket is configured, an uploaded image is
// stored under uploads/<id> and we return a DURABLE url so it survives a scene
// save/reload:
//   • https://<AWS_CDN_DOMAIN>/<key>   when CloudFront is configured (permanent), or
//   • a presigned GET url              otherwise (valid ~6 days — set a CDN for
//                                       permanence; see note below).
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const BUCKET = process.env.AWS_S3_BUCKET?.trim()
const CDN_DOMAIN = process.env.AWS_CDN_DOMAIN?.trim()
  ?.replace(/^https?:\/\//, "")
  .replace(/\/$/, "")
const REGION = (process.env.AWS_REGION || "us-east-1").trim()
const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()

const PRESIGN_TTL_SECONDS = 6 * 24 * 60 * 60

export const STORAGE_ENABLED = Boolean(BUCKET)

let _client: S3Client | null = null
const client = () => {
  if (_client) return _client
  _client = new S3Client({
    region: REGION,
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  })
  return _client
}

/**
 * Upload a buffer to S3 and return a browser-usable URL.
 * Prefer a CloudFront URL (permanent); fall back to a presigned GET when no CDN
 * is configured. Throws if storage is disabled — callers should guard on
 * STORAGE_ENABLED first.
 */
export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (!STORAGE_ENABLED) throw new Error("Object storage is not configured")

  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  )

  if (CDN_DOMAIN) return `https://${CDN_DOMAIN}/${key}`
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: PRESIGN_TTL_SECONDS },
  )
}
