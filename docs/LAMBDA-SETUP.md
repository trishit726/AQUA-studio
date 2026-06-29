# Serverless rendering with Remotion Lambda

Turn on MP4 rendering **on the deployed site** (no local render server). Renders
run on AWS Lambda and write the file to S3; the editor triggers a render, polls
progress, and shows the finished MP4.

The code is already wired (`app/api/render-lambda/*`, `components/editor`). These
steps deploy the AWS pieces and flip the app onto the Lambda path. Run them once.

> Cost note: Lambda + S3 for short renders is cents. Remotion is free for
> individuals/small teams (see remotion.pro/license).

---

## 0. Credentials

Put AWS credentials in `.env` (an IAM user with permission to deploy/invoke
Lambda + use S3). Remotion's CLI reads `REMOTION_AWS_*` first, then `AWS_*`:

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
REMOTION_APP_REGION=us-east-1
```

For the exact least-privilege policy, run `npx remotion lambda policies user` and
attach the printed JSON to the IAM user. (For a quick hackathon setup,
`AdministratorAccess` on a throwaway user also works.)

## 1. Deploy the Lambda function

```bash
npm run lambda:fn
# (= npx remotion lambda functions deploy)
```

Prints something like `remotion-render-4-0-481-mem2048mb-disk2048mb-120sec`.
That is your **function name**.

## 2. Deploy the site (your Remotion bundle → S3)

```bash
npm run lambda:site
# (= npx remotion lambda sites create src/index.ts --site-name=aqua-studio)
```

Prints a **Serve URL** like
`https://remotionlambda-useast1-xxxx.s3.us-east-1.amazonaws.com/sites/aqua-studio/index.html`.

> Re-run this whenever you change a composition, so Lambda renders the latest.

## 3. Set environment variables (Vercel → Settings → Environment Variables)

| Key | Value |
|-----|-------|
| `REMOTION_APP_REGION` | `us-east-1` |
| `REMOTION_APP_FUNCTION_NAME` | the function name from step 1 |
| `REMOTION_APP_SERVE_URL` | the Serve URL from step 2 |
| `NEXT_PUBLIC_LAMBDA_RENDER` | `true` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | (already set for DynamoDB) |

The runtime IAM user needs to **invoke the function** and **read the Remotion S3
bucket** — the policy from step 0 covers this.

## 4. Redeploy Vercel

Env-var changes need a redeploy: **Deployments → ⋯ → Redeploy** (or push a commit).

## 5. Test

On the deployed site: open the editor → **Render MP4**. You'll see
`Rendering on Lambda… 42%` progress, then the finished MP4 appears (served from
S3) and a `success` row lands in **Render History** (DynamoDB). Done — rendering
now works for anyone on the live URL, no local server.

---

### How it works
- `POST /api/render-lambda` → `renderMediaOnLambda(...)` starts the job, returns
  `{ renderId, bucketName }`.
- The editor polls `POST /api/render-lambda/progress` → `getRenderProgress(...)`
  until `done`, then reads the public S3 `outputUrl`.
- Toggle is `NEXT_PUBLIC_LAMBDA_RENDER`; unset → the editor uses the local render
  server (`server/render-server.mjs`) exactly as before. Nothing is removed.

### Notes / limits
- Uploaded **background images** must be a public URL (the S3-offload path) to
  appear in a Lambda render — a local `blob:` preview won't resolve on Lambda.
- Lambda renders the composition at its defined size (1080p). The multi-ratio /
  WebM / GIF derivations are a local-render-server feature.
