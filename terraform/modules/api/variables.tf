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

variable "lambda_storage_bucket" {
  type     = string
  nullable = false
}

variable "cognito_user_pool_id" {
  type     = string
  nullable = false
}
