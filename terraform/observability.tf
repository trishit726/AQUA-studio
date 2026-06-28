# ─────────────────────────────────────────────────────────────────────────────
# Observability — CloudWatch.
#
# The app and render server emit structured logs and CloudWatch EMF metrics
# (Embedded Metric Format) to stdout under the "AquaStudio" namespace — no agent
# or extra wiring required (lib/metrics.ts, server/lib/metrics.mjs). On AWS,
# CloudWatch auto-extracts those metrics; this file gives them a home (log
# group), a dashboard, and an alarm.
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aqua-studio/${var.environment}/app"
  retention_in_days = var.log_retention_days
  tags              = merge(local.tags, { Component = "observability" })
}

resource "aws_cloudwatch_log_group" "render" {
  name              = "/aqua-studio/${var.environment}/render"
  retention_in_days = var.log_retention_days
  tags              = merge(local.tags, { Component = "observability" })
}

# Alarm: renders getting slow (p90 over threshold) → investigate before users feel it.
resource "aws_cloudwatch_metric_alarm" "render_latency" {
  alarm_name          = "${local.name}-render-latency-p90"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = var.render_latency_alarm_ms
  alarm_description    = "p90 render duration exceeded ${var.render_latency_alarm_ms}ms over 3 periods"
  treat_missing_data  = "notBreaching"

  metric_name        = "RenderDurationMs"
  namespace          = local.metrics_namespace
  period             = 300
  extended_statistic = "p90"
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name}"
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric", x = 0, y = 0, width = 12, height = 6,
        properties = {
          title  = "Render duration (p50 / p90)"
          region = data.aws_region.current.name
          view   = "timeSeries"
          metrics = [
            [local.metrics_namespace, "RenderDurationMs", { stat = "p50", label = "p50" }],
            ["...", { stat = "p90", label = "p90" }],
          ]
        }
      },
      {
        type = "metric", x = 12, y = 0, width = 12, height = 6,
        properties = {
          title  = "Scene & render operations"
          region = data.aws_region.current.name
          view   = "timeSeries"
          metrics = [
            [local.metrics_namespace, "SceneSaved", { stat = "Sum" }],
            [local.metrics_namespace, "ScenesListed", { stat = "Sum" }],
            [local.metrics_namespace, "RenderCompleted", { stat = "Sum" }],
            [local.metrics_namespace, "Errors", { stat = "Sum" }],
          ]
        }
      },
      {
        type = "metric", x = 0, y = 6, width = 12, height = 6,
        properties = {
          title  = "DynamoDB consumed capacity"
          region = data.aws_region.current.name
          view   = "timeSeries"
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.table_name, { stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.table_name, { stat = "Sum" }],
          ]
        }
      },
      {
        type = "metric", x = 12, y = 6, width = 12, height = 6,
        properties = {
          title  = "AI generation latency (p90)"
          region = data.aws_region.current.name
          view   = "timeSeries"
          metrics = [
            [local.metrics_namespace, "AiGenerateMs", { stat = "p90", label = "generate p90" }],
            [local.metrics_namespace, "AiScriptMs", { stat = "p90", label = "script p90" }],
          ]
        }
      },
    ]
  })
}
