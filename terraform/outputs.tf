# ── DynamoDB ─────────────────────────────────────────────────────────────────
output "table_name" {
  description = "DynamoDB table name (set as AWS_DYNAMODB_TABLE_NAME)."
  value       = aws_dynamodb_table.pattern_studio.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table — use to scope IAM policies."
  value       = aws_dynamodb_table.pattern_studio.arn
}

output "gsi1_name" {
  description = "Name of the sparse recency index used by listScenes()."
  value       = "GSI1"
}

# ── Object storage / CDN ─────────────────────────────────────────────────────
output "renders_bucket" {
  description = "S3 bucket holding rendered media (set as AWS_S3_BUCKET)."
  value       = aws_s3_bucket.renders.bucket
}

output "cdn_domain" {
  description = "CloudFront domain for rendered media (set as AWS_CDN_DOMAIN). Empty if enable_cdn=false."
  value       = var.enable_cdn ? aws_cloudfront_distribution.renders[0].domain_name : ""
}

# ── Cache ────────────────────────────────────────────────────────────────────
output "dax_endpoint" {
  description = "DAX cluster discovery endpoint (set as AWS_DAX_ENDPOINT). Empty if enable_dax=false."
  value       = var.enable_dax ? aws_dax_cluster.scenes[0].cluster_address : ""
}

# ── Queue ────────────────────────────────────────────────────────────────────
output "render_queue_url" {
  description = "SQS render queue URL. Empty if enable_render_queue=false."
  value       = var.enable_render_queue ? aws_sqs_queue.render[0].url : ""
}

# ── IAM ──────────────────────────────────────────────────────────────────────
output "app_policy_arn" {
  description = "Least-privilege IAM policy ARN for the app (attach to an IAM user or the Vercel OIDC role)."
  value       = aws_iam_policy.app.arn
}

output "vercel_role_arn" {
  description = "ARN of the Vercel OIDC role. Empty unless vercel_oidc_* vars are set."
  value       = local.enable_oidc ? aws_iam_role.vercel[0].arn : ""
}

# ── Observability ────────────────────────────────────────────────────────────
output "cloudwatch_dashboard" {
  description = "CloudWatch dashboard name."
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}
