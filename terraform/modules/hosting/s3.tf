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
    enabled = true
  }

  # Website configuration
  website = {
    index_document = "index.html"
  }

  # CORS configuration - restricted to your domain
  cors_rule = [
    {
      allowed_headers = ["Authorization", "Content-Length"]
      allowed_methods = ["GET", "HEAD"]
      allowed_origins = [data.aws_cloudfront_distribution.existing.domain_name] # Replace with your domain
      expose_headers  = ["ETag"]
      max_age_seconds = 3000
    }
  ]
}

# Create Origin Access Control
resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "OAC for S3 bucket access"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy for CloudFront OAC
resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = module.s3.s3_bucket_id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = ["${module.s3.s3_bucket_arn}/*"]
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = data.aws_cloudfront_distribution.existing.arn
          }
        }
      }
    ]
  })
}

# Data source to get existing CloudFront distribution
data "aws_cloudfront_distribution" "existing" {
  id = "E1PDRD66ARS4F3"
}
