output "website_bucket_name" {
  value = module.client_hosting.s3_bucket.name
}

output "cloudfront_distribution_id" {
  value = module.cloudfront.cloudfront_distribution_id
}


output "base_url" {
  value = module.api.invoke_url
}

output "identity_pool_id" {
  value = module.api.identity_pool_id
}

output "user_pool_client_id" {
  value = module.api.user_pool_client_id
}

output "user_pool_id" {
  value = module.api.user_pool_id
}
