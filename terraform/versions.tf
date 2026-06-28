# Pin Terraform and providers so applies are reproducible across machines.
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5"
    }
  }
}

# Region and credentials are resolved by the provider from the standard chain:
#   AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  (env vars), or
#   ~/.aws/credentials + ~/.aws/config  (the AWS CLI's shared files).
# Nothing secret is ever written into these .tf files.
provider "aws" {
  region = var.aws_region
}
