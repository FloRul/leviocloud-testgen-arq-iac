output "file_upload_bucket_name" {
  value = module.file_upload.s3_bucket_id
}

output "file_process_output_bucket_name" {
  value = module.file_process_output.s3_bucket_id
}
