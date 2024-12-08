﻿output "file_upload_bucket_name" {
  value = module.file_upload.s3_bucket_id
}

output "file_process_output_bucket" {
  value = {
    name = module.file_process_output.s3_bucket_id,
    arn  = module.file_process_output.s3_bucket_arn
  }
}

output "metadata_table" {
  value = {
    name = aws_dynamodb_table.file_metadata.name
    arn  = aws_dynamodb_table.file_metadata.arn
  }
}

output "user_files_bucket" {
  value = {
    name = module.user_files_storage.s3_bucket_id
    arn  = module.user_files_storage.s3_bucket_arn
  }
}
