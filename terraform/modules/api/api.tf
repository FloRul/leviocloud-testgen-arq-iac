locals { api_name = "api" }
data "aws_region" "current" {}

data "aws_cognito_user_pool" "user_pool" {
  user_pool_id = var.cognito_user_pool_id
}

data "aws_cognito_identity_pool" "this" {
  identity_pool_name = var.cognito_identity_pool_name
}

data "aws_cognito_user_pool_client" "this" {
  client_id    = var.aws_cognito_user_pool_client_id
  user_pool_id = data.aws_cognito_user_pool.user_pool.id
}

#checkov:skip=CKV_AWS_225: "AWS API Gateway method settings do not enable caching" - No need for caching
#checkov:skip=CKV2_AWS_51: "Ensure AWS API Gateway endpoints uses client certificate authentication" - No need for client certificate authentication
resource "aws_api_gateway_rest_api" "files_api" {
  name        = "${var.project_name}-${var.environment}-${local.api_name}"
  description = "Watches API for ${var.project_name}-${var.environment}, mostly CRUD operations"

  body = templatefile("${path.module}/api.yml", {
    lambda_arn             = module.lambda_router.lambda_function_arn
    region                 = data.aws_region.current.name
    cognito_user_pool_arns = jsonencode([data.aws_cognito_user_pool.user_pool.arn])
  })

  endpoint_configuration {
    types = ["EDGE"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  
  function_name = module.lambda_router.lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.files_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "this" {
  depends_on  = [aws_api_gateway_account.this]
  rest_api_id = aws_api_gateway_rest_api.files_api.id

  triggers = {
    redeployment = sha256(jsonencode([
      aws_api_gateway_rest_api.files_api.body,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Logging
#checkov:skip=CKV_AWS_158: "Ensure CloudWatch Log Groups are encrypted with KMS by default" - No need for encryption
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "apigateway-${var.project_name}-${var.environment}-${local.api_name}"
  retention_in_days = 365
}

resource "aws_iam_role" "cloudwatch" {
  name = "${var.project_name}-${var.environment}-${local.api_name}-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["apigateway.amazonaws.com", "logs.amazonaws.com"]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "cloudwatch" {
  name = "default"
  role = aws_iam_role.cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "apigateway:*"
        ]
        Resource = "arn:aws:apigateway:*::/*"
      }
    ]
  })
}
resource "aws_api_gateway_account" "this" {
  cloudwatch_role_arn = aws_iam_role.cloudwatch.arn
}

# Add this new resource to enable logging
resource "aws_api_gateway_method_settings" "all" {
  depends_on  = [aws_api_gateway_account.this]
  rest_api_id = aws_api_gateway_rest_api.files_api.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }
}

resource "aws_api_gateway_stage" "this" {
  depends_on    = [aws_api_gateway_account.this]
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.files_api.id
  stage_name    = var.environment
  variables = {
    "cors" = "true"
    
  }
  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"

      # CORS-specific logging
      "cors" = {
        "origin"                = "$context.identity.origin"
        "requestHeaders"        = "$input.params().header.get('Access-Control-Request-Headers')"
        "requestMethod"         = "$input.params().header.get('Access-Control-Request-Method')"
        "responseHeaders"       = "$context.responseHeaders.Access-Control-Allow-Headers"
        "responseOrigin"        = "$context.responseHeaders.Access-Control-Allow-Origin"
        "responseMethods"       = "$context.responseHeaders.Access-Control-Allow-Methods"
        "responseCredentials"   = "$context.responseHeaders.Access-Control-Allow-Credentials"
        "responseMaxAge"        = "$context.responseHeaders.Access-Control-Max-Age"
        "responseExposeHeaders" = "$context.responseHeaders.Access-Control-Expose-Headers"
      }
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}
