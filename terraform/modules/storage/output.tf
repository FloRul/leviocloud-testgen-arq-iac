output "file_upload_bucket_name" {
  value = module.file_upload.s3_bucket_id
}

output "file_process_output_bucket_name" {
  value = module.file_process_output.s3_bucket_id
}

output "metadata_table" {
  value = {
    name = module.dynamodb.dynamodb_table_id
    arn  = module.dynamodb.dynamodb_table_arn
  }
}

output "user_files_bucket" {
  value = {
    name = module.user_files_storage.s3_bucket_id
    arn  = module.user_files_storage.s3_bucket_arn
  }
}
