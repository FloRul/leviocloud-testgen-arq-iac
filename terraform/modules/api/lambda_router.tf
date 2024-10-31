﻿module "lambda_router" {
  source        = "terraform-aws-modules/lambda/aws"
  function_name = "${var.project_name}-${var.environment}-api-router"
  description   = "Lambda function for API Gateway"
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 900
  publish       = true
  source_path   = "${path.cwd}/../../lambda/api_router"

  layers                       = ["arn:aws:lambda:${data.aws_region.current.name}:017000801446:layer:AWSLambdaPowertoolsPythonV2:79"]
  store_on_s3                  = true
  s3_bucket                    = var.lambda_storage_bucket
  trigger_on_package_timestamp = false
  environment_variables = {
    METADATA_TABLE_NAME = var.metadata_table.name
    BUCKET_NAME         = var.file_storage_bucket.name
  }

  role_name                = "${var.project_name}-${var.environment}-api-router-role"
  attach_policy_statements = true

  policy_statements = {
    s3_files = {
      effect = "Allow",
      actions = [
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      resources = [
        var.file_storage_bucket.arn,
        "${var.file_storage_bucket.arn}/*"
      ]
    }
    dynamodb_metadata = {
      effect = "Allow",
      actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      resources = [
        var.metadata_table.arn,
        "${var.metadata_table.arn}/index/*"
      ]
    }
  }
}