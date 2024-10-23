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

variable "dynamo_watch_table" {
  description = "The name of the DynamoDB table."
  type = object({
    name       = string
    arn        = string
    stream_arn = string
  })
  nullable = false
}
