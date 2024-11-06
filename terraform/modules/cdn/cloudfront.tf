data "aws_region" "current" {}

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "CloudFront Distribution for ${var.project_name}-${var.environment} client and API"
  # default_root_object = "index.html"

  # # Configure the origin for the S3 bucket
  # origin {
  #   domain_name = var.s3_bucket_regional_domain_name
  #   origin_id   = "s3-${var.s3_bucket.name}"

  #   s3_origin_config {
  #     origin_access_identity = aws_cloudfront_origin_access_control.this.id
  #   }
  # }

  # Configure the origin for the API Gateway
  origin {
    domain_name = "${var.api_gateway_id}.execute-api.${data.aws_region.current.name}.amazonaws.com"
    origin_id   = "api-gateway"
    origin_path = "/api"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_keepalive_timeout = 5
    }
  }

  default_cache_behavior {
    allowed_methods  = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods   = ["HEAD", "OPTIONS", "GET"]
    target_origin_id = "api-gateway"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # ordered_cache_behavior {
  #   path_pattern     = "/api/*"
  #   allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
  #   cached_methods   = ["GET", "HEAD"]
  #   target_origin_id = "api-gateway"

  #   forwarded_values {
  #     query_string = true
  #     headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

  #     cookies {
  #       forward = "none"
  #     }
  #   }

  #   viewer_protocol_policy = "redirect-to-https"
  #   min_ttl                = 0
  #   default_ttl            = 0
  #   max_ttl                = 0
  # }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# S3 bucket policy for CloudFront OAC
resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = var.s3_bucket.name
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
        Resource = ["${var.s3_bucket.arn}/*"]
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.this.arn
          }
        }
      }
    ]
  })
}

# Create Origin Access Control
resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "OAC for S3 bucket access"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}
