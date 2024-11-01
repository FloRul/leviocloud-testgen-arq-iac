﻿locals {
  lambda_name = "api-router"
}

module "lambda_router" {
  source        = "terraform-aws-modules/lambda/aws"
  function_name = "${var.project_name}-${var.environment}-${local.lambda_name}"
  description   = "Lambda function for API Gateway"
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 900
  publish       = true
  source_path   = "../lambdas/api_router"

  layers                       = ["arn:aws:lambda:${data.aws_region.current.name}:017000801446:layer:AWSLambdaPowertoolsPythonV2:79"]
  store_on_s3                  = true
  s3_bucket                    = var.lambda_storage_bucket
  trigger_on_package_timestamp = false
  environment_variables = {
    METADATA_TABLE          = var.metadata_table.name
    BUCKET_NAME             = var.user_files_bucket.name
    POWERTOOLS_SERVICE_NAME = "${var.project_name}-${var.environment}-${local.lambda_name}"
    INFERENCE_QUEUE_URL     = var.inference_queue.url
  }

  role_name                = "${var.project_name}-${var.environment}-${local.lambda_name}-role"
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
        var.user_files_bucket.arn,
        "${var.user_files_bucket.arn}/*"
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
    sqs_batch_inference = {
      effect = "Allow",
      actions = [
        "sqs:SendMessage"
      ],
      resources = [
        var.inference_queue.arn
      ]
    }
    dynamodb_jobs_status = {
      effect = "Allow",
      actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      resources = [
        var.inference_jobs_status_table.arn,
        "${var.inference_jobs_status_table.arn}/index/*"
      ]
    }
  }
}
