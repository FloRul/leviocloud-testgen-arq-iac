output "website_bucket_name" {
  value = module.client_hosting.s3_bucket.name
}

output "cloudfront_distribution_id" {
  value = module.cloudfront.cloudfront_distribution_id
}
