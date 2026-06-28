# ⚠️ DEPRECATED — do not use this module.
#
# This file previously declared a DynamoDB table keyed on `id` with a
# `userId-updatedAt-index` GSI. That schema did NOT match the application's
# actual single-table design (PK / SK / GSI1; see app/lib/db.ts), so applying it
# would have provisioned a table the app cannot query.
#
# The canonical, correct, well-architected infrastructure now lives in:
#
#     ../terraform/
#
# which models the real single-table DynamoDB design plus S3 object storage,
# CloudFront CDN, DAX cache, SQS render queue, least-privilege IAM (incl. the
# Vercel OIDC role), and CloudWatch observability — all matching the running code.
#
# This stub is kept only so existing references resolve; it provisions nothing.
