# ─────────────────────────────────────────────────────────────────────────────
# SQS render queue — the async scale path.
#
# Today the editor calls the render server synchronously. To scale renders
# horizontally, the API enqueues a render job here and a pool of workers
# (EC2 / ECS / Remotion Lambda) consumes it, writes the MP4 to S3, and records
# the event in DynamoDB. Failed jobs land in a DLQ after 3 attempts. Gated on
# enable_render_queue so the core stack stays lean.
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_sqs_queue" "render_dlq" {
  count                     = var.enable_render_queue ? 1 : 0
  name                      = "${local.name}-render-dlq"
  message_retention_seconds = 1209600 # 14 days — long enough to inspect failures
  tags                      = merge(local.tags, { Component = "queue" })
}

resource "aws_sqs_queue" "render" {
  count                      = var.enable_render_queue ? 1 : 0
  name                       = "${local.name}-render"
  visibility_timeout_seconds = 300 # a render may run for minutes
  message_retention_seconds  = 86400
  receive_wait_time_seconds  = 20 # long polling — fewer empty receives, lower cost
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.render_dlq[0].arn
    maxReceiveCount     = 3
  })
  tags = merge(local.tags, { Component = "queue" })
}
