variable "aws_region" {
  description = "AWS region for all resources. Must match AWS_REGION in your .env."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name prefix for NEW resources (S3, CloudFront, DAX, SQS, CloudWatch)."
  type        = string
  default     = "aqua-studio"
}

variable "environment" {
  description = "Deployment environment name (e.g. production, staging)."
  type        = string
  default     = "production"
}

# ── DynamoDB ─────────────────────────────────────────────────────────────────
# NOTE: the table keeps its original lowercase name so existing user data is
# never orphaned by the product rename (Pattern Studio → Aqua Studio).
variable "table_name" {
  description = "DynamoDB table name. Must match AWS_DYNAMODB_TABLE_NAME in your .env."
  type        = string
  default     = "pattern-studio-scenes"
}

variable "point_in_time_recovery" {
  description = <<-EOT
    Enable continuous backups (35-day restore window). Off by default so a
    `terraform import` of the existing table shows no drift. Flip to true and
    re-apply to harden the table (Well-Architected reliability pillar).
  EOT
  type        = bool
  default     = false
}

# ── S3 object storage (rendered MP4/WebM/GIF) ────────────────────────────────
variable "renders_bucket_name" {
  description = "Override the renders bucket name. Empty = auto-generate a globally-unique name."
  type        = string
  default     = ""
}

variable "render_retention_days" {
  description = "Days to keep rendered media before lifecycle expiry (cost optimization)."
  type        = number
  default     = 7
}

variable "cors_allowed_origins" {
  description = "Origins allowed to read renders directly from S3 (the Vercel app + local dev)."
  type        = list(string)
  default     = ["https://*.vercel.app", "http://localhost:3000", "http://localhost:3001"]
}

# ── CDN ──────────────────────────────────────────────────────────────────────
variable "enable_cdn" {
  description = "Provision a CloudFront distribution in front of the renders bucket."
  type        = bool
  default     = true
}

# ── DAX (DynamoDB Accelerator) — production read cache ───────────────────────
# Off by default: DAX requires a VPC + subnets + security group, which adds cost
# and is unnecessary for local dev. The app falls back to its in-process TTL
# cache (app/lib/cache.ts) when no DAX endpoint is configured.
variable "enable_dax" {
  description = "Provision a DAX cluster (+ minimal VPC) as the production read-through cache."
  type        = bool
  default     = false
}

variable "dax_node_type" {
  description = "DAX node instance type."
  type        = string
  default     = "dax.t3.small"
}

variable "dax_replica_count" {
  description = "Number of DAX nodes (>=3 spreads across AZs for HA in production)."
  type        = number
  default     = 1
}

# ── SQS render queue — async render fan-out (planned scale path) ─────────────
variable "enable_render_queue" {
  description = "Provision the SQS render queue + DLQ for async render workers."
  type        = bool
  default     = false
}

# ── Observability ────────────────────────────────────────────────────────────
variable "log_retention_days" {
  description = "CloudWatch log retention for app/render logs."
  type        = number
  default     = 14
}

variable "render_latency_alarm_ms" {
  description = "Alarm when p90 render duration exceeds this (milliseconds)."
  type        = number
  default     = 120000
}

variable "tags" {
  description = "Base tags applied to every resource."
  type        = map(string)
  default = {
    ManagedBy = "terraform"
  }
}
