module "file_processing_lambda" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "${var.project_name}-${var.environment}-file-processing"

  handler     = "index.handler"
  runtime     = "nodejs20.x"
  source_path = "../lambda/claude-invoke"
  timeout     = 900
  publish     = true
  memory_size = 256
}

