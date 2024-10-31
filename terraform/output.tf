output "website_bucket_name" {
  value = module.client_hosting.website_bucket_name
}

output "cloudfront_distribution_id" {
  value = module.client_hosting.cloudfront_distribution_id
}
