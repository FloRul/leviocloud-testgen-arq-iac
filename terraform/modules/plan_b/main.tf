# S3 Buckets
module "s3_bucket_input" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "${var.project_name}-${var.environment}-input-files"
  acl    = "private"

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

  bucket = "${var.project_name}-${var.environment}-output-files"
  acl    = "private"

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

# SNS Topic
module "sns_topic" {
  source  = "terraform-aws-modules/sns/aws"
  version = "~> 5.0"

  name = "${var.project_name}-${var.environment}-notifications"
  subscriptions = {
    email = {
      protocol = "email"
      endpoint = "florian.rumiel@levio.ca"
    }
  }
}

data "aws_region" "current" {}

# Lambda Module
module "lambda_function" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 5.0"

  function_name = "${var.project_name}-${var.environment}-file-processor"
  description   = "Process files using Bedrock and notify via SNS"
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30

  source_path = "${path.module}/src"

  layers = [
    "arn:aws:lambda:${data.aws_region.current.name}:017000801446:layer:AWSLambdaPowertoolsPython:41"
  ]

  environment_variables = {
    INPUT_BUCKET                 = module.s3_bucket_input.s3_bucket_id
    OUTPUT_BUCKET                = module.s3_bucket_output.s3_bucket_id
    POWERTOOLS_SERVICE_NAME      = "FileProcessing"
    POWERTOOLS_METRICS_NAMESPACE = "FileProcessing"
    LOG_LEVEL                    = "INFO"
  }

  attach_policy_statements = true
  policy_statements = {
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
        "bedrock:InvokeModel"
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
  bucket = module.s3_bucket_input.s3_bucket_id

  lambda_function {
    lambda_function_arn = module.lambda_function.lambda_function_arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [module.lambda_function]
}

# S3 Event Notification to SNS
resource "aws_s3_bucket_notification" "output_notification" {
  bucket = module.s3_bucket_output.s3_bucket_id

  topic {
    topic_arn = module.sns_topic.topic_arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [module.sns_topic]
}
