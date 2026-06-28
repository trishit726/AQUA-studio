// Object storage for rendered media (Amazon S3 + CloudFront).
//
// Env-gated: if AWS_S3_BUCKET is unset, storage is DISABLED and the render
// server keeps serving files from local /out (unchanged dev behaviour). When a
// bucket is configured, each finished render is uploaded under
//   renders/<id>/<file>
// and the browser is handed:
//   • https://<AWS_CDN_DOMAIN>/renders/<id>/<file>   when a CDN is configured, or
//   • a short-lived presigned GET URL                otherwise (bucket stays private).
import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.AWS_S3_BUCKET?.trim();
const CDN_DOMAIN = process.env.AWS_CDN_DOMAIN?.trim()?.replace(/^https?:\/\//, "").replace(/\/$/, "");
const REGION = (process.env.AWS_REGION || "us-east-1").trim();
const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

// Presigned URLs live as long as the lifecycle keeps the object (6 days < the
// 7-day default expiry, and under SigV4's 7-day max).
const PRESIGN_TTL_SECONDS = 6 * 24 * 60 * 60;

export const STORAGE_ENABLED = Boolean(BUCKET);

const CONTENT_TYPES = { mp4: "video/mp4", webm: "video/webm", gif: "image/gif" };

let _client = null;
const client = () => {
  if (_client) return _client;
  _client = new S3Client({
    region: REGION,
    // Explicit creds when present; otherwise the default provider chain
    // (IAM role / Vercel OIDC) resolves them ambiently.
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
  return _client;
};

/**
 * Upload one local render file to S3 and return a browser-usable URL.
 * Returns null on failure so the caller can fall back to the local /out URL —
 * a storage hiccup must never fail an otherwise-successful render.
 *
 * @param {string} localPath absolute path to the rendered file on disk
 * @param {string} key       S3 object key, e.g. "renders/<id>/file.mp4"
 */
export async function uploadRender(localPath, key) {
  if (!STORAGE_ENABLED) return null;
  try {
    const ext = path.extname(localPath).slice(1).toLowerCase();
    const Body = fs.createReadStream(localPath);
    await client().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body,
        ContentType: CONTENT_TYPES[ext] || "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    if (CDN_DOMAIN) return `https://${CDN_DOMAIN}/${key}`;
    // No CDN → private bucket → presigned GET so the browser can still fetch it.
    return await getSignedUrl(
      client(),
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: PRESIGN_TTL_SECONDS },
    );
  } catch (err) {
    console.error(`[storage] upload failed for ${key}:`, err?.message ?? err);
    return null;
  }
}
