data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  name = "${var.project_name}-${var.environment}"

  tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
  })

  # Globally-unique bucket name. Either the explicit override, or a name derived
  # from the project + a stable random suffix.
  renders_bucket = var.renders_bucket_name != "" ? var.renders_bucket_name : "${local.name}-renders-${random_id.bucket_suffix.hex}"

  # Namespace the app/render server emit CloudWatch EMF metrics under.
  metrics_namespace = "AquaStudio"
}

resource "random_id" "bucket_suffix" {
  byte_length = 3
}
