resource "aws_dynamodb_table" "file_metadata" {
  name           = "${var.project_name}-file-metadata-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"  # Or use PROVISIONED with read/write capacity units
  hash_key       = "user_id"
  range_key      = "filename"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "filename"
    type = "S"
  }

  # Optional: Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Optional: Server-side encryption with AWS managed key
  server_side_encryption {
    enabled = true
  }

  # Optional: TTL if you want to automatically delete old metadata
  ttl {
    enabled        = false
    attribute_name = "expiry_date"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Terraform   = "true"
  }
}

# Optional: Create a secondary index for querying by other attributes
resource "aws_dynamodb_table_global_secondary_index" "upload_date_index" {
  name               = "UploadDateIndex"
  hash_key          = "user_id"
  range_key         = "upload_date"
  table_name        = aws_dynamodb_table.file_metadata.name
  projection_type   = "ALL"
}