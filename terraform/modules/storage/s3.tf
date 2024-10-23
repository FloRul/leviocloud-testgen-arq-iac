module "file_upload" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "${project_name}-file-upload"
  acl    = "private"
}

module "file_process_output" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "${var.project_name}-${var.environment}-file-process-output"
  acl    = "private"
}
