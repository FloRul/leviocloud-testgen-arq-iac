﻿# S3 Buckets
module "s3_bucket_input" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket                  = "${var.project_name}-${var.environment}-input-files"
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }
}

module "s3_bucket_output" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket                  = "${var.project_name}-${var.environment}-output-files"
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }
}

data "aws_caller_identity" "current" {}


data "aws_region" "current" {}

# Lambda Module
module "lambda_function" {
  source        = "terraform-aws-modules/lambda/aws"
  depends_on    = [module.s3_bucket_input, module.s3_bucket_output]
  function_name = "${var.project_name}-${var.environment}-file-processor"
  description   = "Process files using Bedrock and notify via SNS"
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 900
  publish       = true
  source_path   = "${path.module}/src"
  trigger_on_package_timestamp = false
  layers = [
    "arn:aws:lambda:${data.aws_region.current.name}:017000801446:layer:AWSLambdaPowertoolsPythonV3-python311-x86_64:2"
  ]

  environment_variables = {
    INPUT_BUCKET                 = module.s3_bucket_input.s3_bucket_id
    OUTPUT_BUCKET                = module.s3_bucket_output.s3_bucket_id
    POWERTOOLS_SERVICE_NAME      = "FileProcessing"
    POWERTOOLS_METRICS_NAMESPACE = "FileProcessing"
    LOG_LEVEL                    = "INFO"
    SNS_TOPIC_ARN                = aws_sns_topic.file_processor.arn
  }

  attach_policy_statements = true
  policy_statements = {
    s3_output_presign = {
      effect = "Allow"
      actions = [
        "s3:GetObject"
      ]
      resources = [
        module.s3_bucket_output.s3_bucket_arn,
        "${module.s3_bucket_output.s3_bucket_arn}/*"
      ]
    }
    s3_input = {
      effect = "Allow"
      actions = [
        "s3:GetObject",
        "s3:ListBucket"
      ]
      resources = [
        module.s3_bucket_input.s3_bucket_arn,
        "${module.s3_bucket_input.s3_bucket_arn}/*"
      ]
    }
    s3_output = {
      effect = "Allow"
      actions = [
        "s3:PutObject"
      ]
      resources = [
        module.s3_bucket_output.s3_bucket_arn,
        "${module.s3_bucket_output.s3_bucket_arn}/*"
      ]
    }
    bedrock = {
      effect = "Allow"
      actions = [
        "bedrock:InvokeModel*"
      ]
      resources = ["*"]
    }
    cloudwatch = {
      effect = "Allow"
      actions = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      resources = ["arn:aws:logs:*:*:*"]
    }
    xray = {
      effect = "Allow"
      actions = [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ]
      resources = ["*"]
    }
    sns = {
      effect = "Allow"
      actions = [
        "sns:Publish"
      ]
      resources = [aws_sns_topic.file_processor.arn]
    }
  }

  allowed_triggers = {
    S3Input = {
      service    = "s3"
      source_arn = module.s3_bucket_input.s3_bucket_arn
    }
  }
}

# S3 Event Notification to Lambda
resource "aws_s3_bucket_notification" "input_notification" {
  bucket     = module.s3_bucket_input.s3_bucket_id
  depends_on = [module.lambda_function]

  lambda_function {
    lambda_function_arn = module.lambda_function.lambda_function_arn
    events              = ["s3:ObjectCreated:*"]
  }

}

resource "aws_sns_topic" "file_processor" {
  #checkov:skip=CKV_AWS_26: "Ensure all data stored in the SNS topic is encrypted" - No need for encryption
  name = "${var.project_name}-${var.environment}-processor-output-topic"
}
