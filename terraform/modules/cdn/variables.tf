variable "environment" {
  description = "The name of the environment."
  type        = string
  nullable    = false
}

variable "project_name" {
  description = "The name of the project."
  type        = string
  nullable    = false
}

variable "s3_bucket" {
  description = "The ID of the S3 bucket"
  type = object({
    name = string
    arn  = string
  })
}

variable "s3_bucket_domain_name" {
  description = "The regional domain name of the S3 bucket"
  type        = string
}

variable "api_gateway_id" {
  description = "The ID of the API Gateway REST API"
  type        = string
}

variable "api_gateway_stage_name" {
  description = "The name of the API Gateway stage"
  type        = string
}
variable "cloudfront_alias" {
  type     = string
  nullable = false
}
