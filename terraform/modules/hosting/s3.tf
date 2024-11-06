module "s3" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.2"

  bucket = "${var.project_name}-${var.environment}-hosting"
  acl    = null # Don't use ACL with OAC

  # Block all public access
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  # Enable versioning
  versioning = {
    enabled = false
  }
  force_destroy = true
  # CORS configuration - restricted to your domain
}

