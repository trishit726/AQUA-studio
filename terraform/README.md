# Aqua Studio — Infrastructure (Terraform)

The single, canonical infrastructure-as-code for Aqua Studio's AWS backend.
Every resource here matches the running application — the DynamoDB key schema in
`main.tf` is exactly what `app/lib/db.ts` queries, the S3 layout is exactly what
`server/render-server.mjs` writes, and the metrics namespace is exactly what the
app emits.

> The old `../infra/main.tf` is **deprecated** — it declared a table schema that
> didn't match the app. This `terraform/` module supersedes it.

## Layout

| File | What it defines |
|------|-----------------|
| `versions.tf`       | Terraform + AWS/random provider pins, provider region |
| `variables.tf`      | All inputs (region, names, feature flags, retention, alarm thresholds) |
| `locals.tf`         | Shared naming, tags, the globally-unique bucket name |
| `main.tf`           | **DynamoDB** — single table, PK/SK + sparse GSI1, on-demand |
| `storage.tf`        | **S3** renders bucket (private, encrypted, lifecycle, CORS) + **CloudFront** CDN via OAC |
| `cache.tf`          | **DAX** read-through cache (+ minimal VPC) — `enable_dax` |
| `queue.tf`          | **SQS** render queue + DLQ — `enable_render_queue` |
| `iam.tf`            | Least-privilege app policy + **Vercel OIDC** role |
| `observability.tf`  | **CloudWatch** log groups, dashboard, p90 render-latency alarm |
| `outputs.tf`        | Every value the app's `.env` / Vercel env needs |

## What's on by default vs. flagged

The **core** stack — DynamoDB, S3, CloudFront, IAM, CloudWatch — applies with no
extra flags. The **heavier** pieces are gated so a first apply stays cheap and
needs no VPC:

| Flag | Default | Turns on |
|------|---------|----------|
| `enable_cdn`           | `true`  | CloudFront in front of the renders bucket |
| `enable_dax`           | `false` | DAX cluster + its VPC (production read cache) |
| `enable_render_queue`  | `false` | SQS render queue + DLQ (async render workers) |
| `point_in_time_recovery` | `false` | DynamoDB 35-day continuous backups |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5
- AWS credentials in your environment (same as `.env`):
  ```bash
  export AWS_ACCESS_KEY_ID=...
  export AWS_SECRET_ACCESS_KEY=...
  export AWS_REGION=us-east-1
  ```
  (PowerShell: `$env:AWS_ACCESS_KEY_ID = "..."`)

## The table already exists — import it first

`npm run setup:db` already created `pattern-studio-scenes`. Don't let Terraform
recreate it. Import the live table so Terraform adopts it:

```bash
cd terraform
terraform init
terraform import aws_dynamodb_table.pattern_studio pattern-studio-scenes
terraform plan   # should show no schema change, only tag/feature additions
terraform apply
```

## Wiring the outputs back into the app

After apply, feed the outputs into your `.env` (local) or Vercel env vars:

```bash
AWS_S3_BUCKET=$(terraform output -raw renders_bucket)   # render server → S3
AWS_CDN_DOMAIN=$(terraform output -raw cdn_domain)       # serve renders via CDN
AWS_DAX_ENDPOINT=$(terraform output -raw dax_endpoint)   # (if enable_dax) cached reads
```

When these are unset the app degrades gracefully: renders fall back to local
`/out`, and reads use the in-process TTL cache instead of DAX. Nothing breaks.

## Notes

- **State is not committed** (`terraform.tfstate` is git-ignored). For a team,
  use a remote backend (S3 + a DynamoDB lock table).
- **`prevent_destroy` is on** for the table (it holds user data).
- Keep `main.tf` in sync with `app/lib/db.ts` — the PK/SK + GSI1 schema must
  match what the application queries.
