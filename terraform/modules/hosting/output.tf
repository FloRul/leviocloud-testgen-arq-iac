output "website_bucket_name" {
  value = module.s3.s3_bucket_id
}

output "cloudfront_distribution_id" {
  value = data.aws_cloudfront_distribution.existing.id
}
