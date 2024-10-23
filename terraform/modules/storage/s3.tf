module "file_upload" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket                  = "${var.project_name}-file-upload"
  acl                     = "private"
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

module "file_process_output" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket                  = "${var.project_name}-${var.environment}-file-process-output"
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
