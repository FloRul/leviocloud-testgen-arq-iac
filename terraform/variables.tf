variable "environment" {
  type     = string
  nullable = false
}

variable "cognito_user_pool_id" {
  type     = string
  nullable = false
}

variable "cognito_identity_pool_name" {
  type     = string
  nullable = false
}

variable "cognito_user_pool_client_id" {
  type     = string
  nullable = false
}

variable "cloudfront_alias" {
  type     = string
  nullable = false
}

variable "acm_certificate_id" {
  type     = string
  nullable = false
}
