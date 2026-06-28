# ─────────────────────────────────────────────────────────────────────────────
# Aqua Studio — DynamoDB table (single-table design).
#
# This is the SAME table the app provisions via `npm run setup:db`, expressed as
# infrastructure-as-code. One per-user item collection holds every graphic type
# (scenes + render history), keyed for these access patterns:
#
#   PK / SK          composite primary key  (USER#<id> / SCENE#.. | RENDER#..)
#   GSI1             sparse index for recency-sorted "list a user's scenes"
#                    (GSI1PK = USER#<id>, GSI1SK = updatedAt)
#
# On-demand billing: no capacity to provision, scales to zero. The schema here
# matches app/lib/db.ts exactly — keep them in sync.
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "pattern_studio" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "PK"
  range_key = "SK"

  # Only key/index attributes are declared. DynamoDB is schemaless for every
  # other attribute (name, props, template, updatedAt, …) — those live on the
  # items, not in the table definition.
  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  attribute {
    name = "GSI1SK"
    type = "N"
  }

  # Sparse recency index. Only Scene items carry GSI1PK/GSI1SK, so render-history
  # items never appear in (or add cost to) this index.
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery
  }

  # Auto-expire render-history events: they carry a `ttl` epoch-seconds attribute
  # (set in app/lib/db.ts → recordRender), scenes do not. Keeps the time-series
  # side of each user's partition bounded at no extra cost.
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(local.tags, { Component = "database" })

  # The table holds user data — guard against an accidental `terraform destroy`.
  # Remove this block if you intend to tear the environment down.
  lifecycle {
    prevent_destroy = true
  }
}
