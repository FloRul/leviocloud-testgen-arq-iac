data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
resource "aws_iam_role" "batch_inference_role" {
  name = "${var.project_name}-${var.environment}-batch-inference-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" : data.aws_caller_identity.current.account_id
          }
          ArnEquals = {
            "aws:SourceArn" : "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:model-invocation-job/*"
          }
        }
      }
    ]
  })
}

# IAM Policy for S3 access
resource "aws_iam_role_policy" "batch_inference_policy" {
  name = "${var.project_name}-${var.environment}-batch-inference-policy"
  role = aws_iam_role.batch_inference_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ],
        Resource = [
          "arn:aws:s3:::my_input_bucket", # Replace with your input bucket name
          "arn:aws:s3:::my_input_bucket/*",
          "arn:aws:s3:::my_output_bucket", # Replace with your output bucket name
          "arn:aws:s3:::my_output_bucket/*"
        ],
        Condition = {
          StringEquals = {
            "aws:ResourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "batch_inference_role_policy_attachment" {
  role       = aws_iam_role.batch_inference_role.name
  policy_arn = aws_iam_policy.batch_inference_policy.arn
}
