# Aqua Studio — Technical Architecture

A practical, detailed walkthrough of how Aqua Studio is built: the tech stack,
every AWS service used and **exactly how** it's used, the request flows, the data
model, and how it's deployed. Written to be read by an engineer.

---

## 1. What it is

Aqua Studio is a browser-based motion-graphics studio. You design a bold animated
title card in a live editor, save it, and render it to a real MP4 — all on a
deployed web app, with **no sign-in and no local setup**. The frontend is on
Vercel; the backend is AWS (DynamoDB + Lambda + S3 + CloudWatch).

---

## 2. Tech stack

| Layer | Technology |
|-------|-----------|
| **Frontend / editor** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI |
| **Animation / preview** | Remotion 4 + `@remotion/player` (frame-accurate live preview in the browser) |
| **Backend API** | Next.js Route Handlers (`app/api/*`), Node.js runtime, on Vercel serverless functions |
| **Primary database** | **Amazon DynamoDB** (single-table design, on-demand) |
| **Serverless rendering** | **AWS Lambda** via `@remotion/lambda` (`renderMediaOnLambda`) |
| **Object storage** | **Amazon S3** (render outputs + uploaded images) |
| **Observability** | **Amazon CloudWatch** (EMF metrics + logs) |
| **Identity** | Anonymous device-id (localStorage); Clerk optional |
| **Infra as code** | Terraform (DynamoDB, S3, CloudFront, DAX, SQS, IAM, CloudWatch) |
| **AWS SDKs** | `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-s3`, `@remotion/lambda` |

---

## 3. AWS services — what we used and how

### 3.1 Amazon DynamoDB — the primary database

**How we use it:** one table, a **single-table design**, holding every entity.
Each user owns one *item collection* (all items sharing their partition key).

```
Primary key
  PK = "USER#<userId>"
  SK = "SCENE#<sceneId>"               → a saved scene
       "RENDER#<paddedEpochMs>#<id>"   → a render-history event

GSI1 (sparse — scenes only)
  GSI1PK = "USER#<userId>"
  GSI1SK = updatedAt (Number)          → list a user's scenes by recency
```

**Access patterns** (all in `app/lib/db.ts`, all single-partition, **zero Scans**):

| Operation | DynamoDB call | Notes |
|-----------|---------------|-------|
| Save scene | `UpdateItem` | `if_not_exists(createdAt)` → idempotent re-save |
| Load scene | `GetItem`, `ConsistentRead` | strong read-after-write |
| List scenes | `Query` on GSI1, reverse | **paginated** via `LastEvaluatedKey` cursor |
| Delete scene | `DeleteItem`, `attribute_exists(PK)` | ownership enforced, no read-before-write |
| Record render | `PutItem` with a `ttl` attr | auto-expires after 90 days |
| List renders | `Query` PK + `begins_with(SK,"RENDER#")` | same partition, no extra index |

**Why these choices:**
- **Single-table + per-user partition** → a user's scenes and render history come
  back in one round trip; the partition key (`USER#<id>`) is high-cardinality, so
  DynamoDB shards evenly across users with no global hot partition.
- **Sparse GSI** → only scenes carry the index attributes; render events stay off
  the index and cost nothing on it.
- **Ownership by the key** → an API call can only ever address `USER#<caller>`;
  there is no code path to another user's data.
- **TTL** on render events keeps the time-series side bounded for free.
- **On-demand billing** → scales to zero at idle, no capacity planning.
- **In-process read-through cache** (`app/lib/cache.ts`) fronts `listScenes`;
  DAX is the provisioned production cache (Terraform).

### 3.2 AWS Lambda — serverless MP4 rendering

Rendering launches headless Chromium + ffmpeg for tens of seconds — it can't run
in a Vercel function. **We run it on AWS Lambda via Remotion.**

**How we set it up (one-time):**
- `npx remotion lambda functions deploy` → deploys the render function
  (`remotion-render-4-0-481-mem2048mb-disk2048mb-120sec`).
- `npx remotion lambda sites create src/index.ts --site-name=aqua-studio` →
  bundles the Remotion project and uploads it to S3 as a "site" (the Serve URL).
- An IAM role `remotion-lambda-role` is the function's execution role; the
  deploying/invoking user has the scoped Remotion policy.

**How the app uses it at runtime** (`app/api/render-lambda/*`):
1. `POST /api/render-lambda` calls `renderMediaOnLambda({ functionName, serveUrl,
   composition, inputProps, codec:"h264", privacy:"public" })` and returns
   `{ renderId, bucketName }`. The call is non-blocking — Lambda keeps rendering.
2. The editor polls `POST /api/render-lambda/progress` → `getRenderProgress(...)`
   until `done`, surfacing `overallProgress` as a `%` in the UI.
3. When done, Lambda has written `out.mp4` to S3; the response includes the public
   `outputUrl`, which the browser plays/downloads.

**Why Lambda:** it auto-scales render concurrency (a burst of renders = more
Lambda invocations, not a queue backing up), costs cents per render, and needs no
server to keep running. Toggled by `NEXT_PUBLIC_LAMBDA_RENDER`; without it the app
falls back to the local Express render server (`server/render-server.mjs`).

### 3.3 Amazon S3 — object storage

**Two uses:**
- **Render output** — Remotion Lambda writes each finished MP4 to its managed
  bucket (`remotionlambda-useast1-…`) under `renders/<renderId>/out.mp4`, served
  via a public URL.
- **Image uploads** — uploaded background images go to S3 via `/api/upload`
  (`lib/server/storage.ts`); the **scene item stores only the URL**, never the
  binary, so DynamoDB items stay small and never approach the 400 KB limit.

The Terraform stack also defines a private, encrypted renders bucket with a 7-day
lifecycle and a CloudFront distribution (OAC) for a self-hosted media path.

### 3.4 Amazon CloudWatch — observability

The app and render server emit **CloudWatch EMF** (Embedded Metric Format) — a
single structured JSON line per event that CloudWatch auto-extracts into metrics,
with **no agent and no PutMetricData call** (`lib/metrics.ts`,
`server/lib/metrics.mjs`). Metrics: `SceneSaved`, `ScenesListed`,
`ScenesListedMs`, `RenderDurationMs`, `RenderCompleted`, `LambdaRenderStarted`,
`ImageUploaded`, `Errors`. Terraform provisions a dashboard and a p90
render-latency alarm.

### 3.5 IAM — security

- A **least-privilege application policy** (Terraform, `terraform/iam.tf`) scopes
  the app to exactly one DynamoDB table (+ its GSI) and the `renders/` S3 prefix.
- A dedicated **`remotion-lambda-role`** is the Lambda execution role.
- A **Vercel OIDC role** is modeled for the no-stored-keys path.

### 3.6 Provisioned (Terraform), flag-gated scale path

- **DAX** (`enable_dax`) — DynamoDB Accelerator as the production read cache.
- **SQS + DLQ** (`enable_render_queue`) — async render fan-out for extreme bursts.
- **CloudFront** (`enable_cdn`) — global CDN over the self-hosted media bucket.

---

## 4. Request flows (end-to-end)

**Save a scene**
```
editor → POST /api/save {id,userId,name,props,duration}
       → saveScene(): UpdateItem  PK=USER#<id>  SK=SCENE#<id>
       → invalidate list cache → 200 {item}
```

**Load the library**
```
editor → GET /api/list?userId=<id>&limit&cursor
       → listScenes(): Query GSI1 (recency), paginated
       → 200 { items, nextCursor }
```

**Render an MP4 (serverless)**
```
editor → POST /api/render-lambda {composition, inputProps}
       → renderMediaOnLambda() → { renderId, bucketName }     (Lambda starts)
loop:  → POST /api/render-lambda/progress {renderId,bucketName}
       → getRenderProgress() → { overallProgress, done, outputUrl }
done:  → Lambda has written out.mp4 to S3 → browser plays outputUrl
       → POST /api/log-render → PutItem RENDER#…  (DynamoDB, TTL'd)
       → Render History panel refreshes
```

*Measured live:* trigger → progress `0.18 → 1.0` → public `out.mp4` (~1.2 MB) in
~36 s.

---

## 5. Identity (no friction)

On first visit, `lib/auth.tsx` generates a persistent `anon-<uuid>` in
`localStorage` and uses it as the DynamoDB partition key. There is no sign-in
step; every visitor is an isolated partition. Clerk is wired as an optional
account layer but never required.

---

## 6. Deployment & configuration

- **Frontend + API:** GitHub → Vercel (auto-deploy on push). Next.js auto-detected.
- **Runtime env vars (Vercel):**
  `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_DYNAMODB_TABLE_NAME=pattern-studio-scenes`,
  `REMOTION_APP_REGION`, `REMOTION_APP_FUNCTION_NAME`, `REMOTION_APP_SERVE_URL`,
  `NEXT_PUBLIC_LAMBDA_RENDER=true`.
- **Table provisioning:** `npm run setup:db` (or `terraform apply`).
- **Lambda provisioning:** `npm run lambda:fn` + `npm run lambda:site`
  (see [`LAMBDA-SETUP.md`](../LAMBDA-SETUP.md)).

---

## 7. Local development vs. production

| | Local dev | Production (Vercel) |
|--|-----------|---------------------|
| Frontend/API | `npm run dev` | Vercel serverless |
| Database | same DynamoDB table | same DynamoDB table |
| Rendering | local Express server (`npm run server`, ffmpeg multi-format) | **AWS Lambda → S3** |
| Identity | anonymous device-id | anonymous device-id |

The render path is the only thing that differs, switched by one env var
(`NEXT_PUBLIC_LAMBDA_RENDER`) — everything else is identical.
