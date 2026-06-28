# ─────────────────────────────────────────────────────────────────────────────
# Least-privilege application policy.
#
# The app needs exactly: CRUD on its own DynamoDB table (+ the GSI for queries),
# and read/write of rendered objects under the renders/ prefix in S3. Nothing
# else. This document is what an IAM user OR the Vercel OIDC role (below) gets.
# ─────────────────────────────────────────────────────────────────────────────
data "aws_iam_policy_document" "app" {
  statement {
    sid    = "SceneTableAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query",
      "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
    ]
    resources = [
      aws_dynamodb_table.pattern_studio.arn,
      "${aws_dynamodb_table.pattern_studio.arn}/index/*",
    ]
  }

  statement {
    sid       = "RenderObjectAccess"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["${aws_s3_bucket.renders.arn}/renders/*"]
  }
}

resource "aws_iam_policy" "app" {
  name        = "${local.name}-app"
  description = "Least-privilege access for the Aqua Studio app (DynamoDB table + renders bucket)."
  policy      = data.aws_iam_policy_document.app.json
  tags        = local.tags
}

# ── Vercel OIDC role (most secure: no long-lived keys in env vars) ───────────
# The hackathon's own guidance recommends the Vercel Marketplace OIDC path. Set
# vercel_oidc_subject to your project's subject claim to enable it; otherwise
# the app uses static AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (also supported).
variable "vercel_oidc_subject" {
  description = "Vercel OIDC subject (e.g. owner:<team>:project:<name>:environment:production). Empty disables the role."
  type        = string
  default     = ""
}

variable "vercel_oidc_provider_arn" {
  description = "ARN of the Vercel OIDC provider in your account. Empty disables the role."
  type        = string
  default     = ""
}

locals {
  enable_oidc = var.vercel_oidc_subject != "" && var.vercel_oidc_provider_arn != ""
}

data "aws_iam_policy_document" "vercel_assume" {
  count = local.enable_oidc ? 1 : 0
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [var.vercel_oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "oidc.vercel.com/aud"
      values   = ["https://vercel.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "oidc.vercel.com/sub"
      values   = [var.vercel_oidc_subject]
    }
  }
}

resource "aws_iam_role" "vercel" {
  count              = local.enable_oidc ? 1 : 0
  name               = "${local.name}-vercel"
  assume_role_policy = data.aws_iam_policy_document.vercel_assume[0].json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "vercel_app" {
  count      = local.enable_oidc ? 1 : 0
  role       = aws_iam_role.vercel[0].name
  policy_arn = aws_iam_policy.app.arn
}
