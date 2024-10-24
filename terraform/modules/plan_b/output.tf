
# Outputs
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.lambda_function.lambda_function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = module.lambda_function.lambda_function_arn
}

output "input_bucket_name" {
  description = "Name of the input S3 bucket"
  value       = module.s3_bucket_input.s3_bucket_id
}

output "output_bucket_name" {
  description = "Name of the output S3 bucket"
  value       = module.s3_bucket_output.s3_bucket_id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = module.sns_topic.topic_arn
}
