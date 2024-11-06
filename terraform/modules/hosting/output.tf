output "s3_bucket" {
  value = {
    name = module.s3.s3_bucket_id
    arn  = module.s3.s3_bucket_arn
  }
}

output "s3_bucket_regional_domain_name" {
  value = module.s3.s3_bucket_domain_name
}
