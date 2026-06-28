# ─────────────────────────────────────────────────────────────────────────────
# DAX — DynamoDB Accelerator (production read-through cache).
#
# DAX gives microsecond cached reads for the hot path (listScenes / getScene)
# without changing the application's DynamoDB call shape. It is OFF by default
# because it requires a VPC; when disabled, the app uses its in-process TTL
# cache (app/lib/cache.ts). Point the app at this cluster by setting
# AWS_DAX_ENDPOINT to the cluster's cluster_discovery_endpoint.
#
# A minimal VPC (2 AZs) is created alongside it, all gated on enable_dax.
# ─────────────────────────────────────────────────────────────────────────────
data "aws_availability_zones" "available" {
  count = var.enable_dax ? 1 : 0
  state = "available"
}

resource "aws_vpc" "dax" {
  count                = var.enable_dax ? 1 : 0
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.tags, { Name = "${local.name}-dax-vpc", Component = "cache" })
}

resource "aws_subnet" "dax" {
  count             = var.enable_dax ? 2 : 0
  vpc_id            = aws_vpc.dax[0].id
  cidr_block        = "10.20.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available[0].names[count.index]
  tags              = merge(local.tags, { Name = "${local.name}-dax-${count.index}", Component = "cache" })
}

resource "aws_dax_subnet_group" "dax" {
  count      = var.enable_dax ? 1 : 0
  name       = "${local.name}-dax"
  subnet_ids = aws_subnet.dax[*].id
}

resource "aws_security_group" "dax" {
  count       = var.enable_dax ? 1 : 0
  name        = "${local.name}-dax"
  description = "DAX cluster access (port 8111)"
  vpc_id      = aws_vpc.dax[0].id

  ingress {
    description = "DAX from within the VPC"
    from_port   = 8111
    to_port     = 8111
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.dax[0].cidr_block]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.tags, { Component = "cache" })
}

# DAX's service role — it reads/writes the table on the app's behalf.
data "aws_iam_policy_document" "dax_assume" {
  count = var.enable_dax ? 1 : 0
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["dax.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "dax" {
  count              = var.enable_dax ? 1 : 0
  name               = "${local.name}-dax"
  assume_role_policy = data.aws_iam_policy_document.dax_assume[0].json
  tags               = local.tags
}

resource "aws_iam_role_policy" "dax" {
  count = var.enable_dax ? 1 : 0
  name  = "${local.name}-dax-table-access"
  role  = aws_iam_role.dax[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query",
        "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
        "dynamodb:BatchWriteItem", "dynamodb:ConditionCheckItem",
        "dynamodb:DescribeTable",
      ]
      Resource = [
        aws_dynamodb_table.pattern_studio.arn,
        "${aws_dynamodb_table.pattern_studio.arn}/index/*",
      ]
    }]
  })
}

resource "aws_dax_cluster" "scenes" {
  count              = var.enable_dax ? 1 : 0
  cluster_name       = "${local.name}-scenes"
  iam_role_arn       = aws_iam_role.dax[0].arn
  node_type          = var.dax_node_type
  replication_factor = var.dax_replica_count
  subnet_group_name  = aws_dax_subnet_group.dax[0].name
  security_group_ids = [aws_security_group.dax[0].id]

  server_side_encryption {
    enabled = true
  }
  tags = merge(local.tags, { Component = "cache" })
}
