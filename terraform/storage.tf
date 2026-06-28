# ─────────────────────────────────────────────────────────────────────────────
# Object storage — rendered media (MP4 / WebM / GIF).
#
# The render server (server/render-server.mjs) uploads each finished render here
# under  renders/<id>/<file>  and hands the browser a CloudFront (or presigned
# S3) URL. The bucket is PRIVATE; reads go through CloudFront via Origin Access
# Control, or via short-lived presigned URLs when the CDN is disabled.
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "renders" {
  bucket = local.renders_bucket
  tags   = merge(local.tags, { Component = "object-storage" })
}

# Private by default — nothing is world-readable. Access is mediated by
# CloudFront (OAC) or presigned URLs.
resource "aws_s3_bucket_public_access_block" "renders" {
  bucket                  = aws_s3_bucket.renders.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "renders" {
  bucket = aws_s3_bucket.renders.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Encrypt everything at rest (SSE-S3). Well-Architected: security pillar.
resource "aws_s3_bucket_server_side_encryption_configuration" "renders" {
  bucket = aws_s3_bucket.renders.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Renders are derived artifacts — expire them to keep storage cost near zero.
resource "aws_s3_bucket_lifecycle_configuration" "renders" {
  bucket = aws_s3_bucket.renders.id

  rule {
    id     = "expire-rendered-media"
    status = "Enabled"
    filter {
      prefix = "renders/"
    }
    expiration {
      days = var.render_retention_days
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# CORS so the browser can fetch (or PUT, for direct uploads) against the bucket.
resource "aws_s3_bucket_cors_configuration" "renders" {
  bucket = aws_s3_bucket.renders.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ── CloudFront CDN (Origin Access Control — the current best practice) ────────
resource "aws_cloudfront_origin_access_control" "renders" {
  count                             = var.enable_cdn ? 1 : 0
  name                              = "${local.name}-renders-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "renders" {
  count               = var.enable_cdn ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name} — rendered media CDN"
  price_class         = "PriceClass_100"
  http_version        = "http2and3"

  origin {
    domain_name              = aws_s3_bucket.renders.bucket_regional_domain_name
    origin_id                = "renders-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.renders[0].id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "renders-s3"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    # Managed "CachingOptimized" policy — long TTLs, gzip/br, no cookies.
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.tags, { Component = "cdn" })
}

# Bucket policy: only this CloudFront distribution may read objects.
data "aws_iam_policy_document" "renders_cdn_read" {
  count = var.enable_cdn ? 1 : 0
  statement {
    sid       = "AllowCloudFrontRead"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.renders.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.renders[0].arn]
    }
  }
}

resource "aws_s3_bucket_policy" "renders_cdn" {
  count  = var.enable_cdn ? 1 : 0
  bucket = aws_s3_bucket.renders.id
  policy = data.aws_iam_policy_document.renders_cdn_read[0].json
}
