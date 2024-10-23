locals {
  api_name = "api"
}
#checkov:skip=CKV_AWS_225: "AWS API Gateway method settings do not enable caching" - No need for caching
#checkov:skip=CKV2_AWS_51: "Ensure AWS API Gateway endpoints uses client certificate authentication" - No need for client certificate authentication
data "aws_region" "current" {}
resource "aws_api_gateway_rest_api" "vigie_api" {
  name        = "${var.project_name}-${var.environment}-${local.api_name}"
  description = "Watches API for ${var.project_name}-${var.environment}, mostly CRUD operations"

  body = templatefile("${path.module}/api.yml", {})

  endpoint_configuration {
    types = ["EDGE"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_deployment" "this" {
  depends_on  = [aws_api_gateway_account.this]
  rest_api_id = aws_api_gateway_rest_api.vigie_api.id

  triggers = {
    redeployment = sha256(jsonencode([
      aws_api_gateway_rest_api.vigie_api.body,
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
  rest_api_id = aws_api_gateway_rest_api.vigie_api.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }
}

# Update the stage resource to include log settings
resource "aws_api_gateway_stage" "this" {
  depends_on    = [aws_api_gateway_account.this]
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.vigie_api.id
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
