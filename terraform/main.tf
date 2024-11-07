terraform {
  backend "s3" {
    bucket = "leviocloud-testgen-arq-iac-tfstate"
    key    = "terraform.tfstate"
    region = "ca-central-1"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.72.1"
    }
  }
}

provider "aws" {
  region = "ca-central-1"
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "leviocloud-testgen-arq-iac"
    }
  }
}

locals {
  project_name = "leviocloud-testgen-arq-iac"
}

resource "aws_s3_bucket" "code_storage" {
  bucket = "${local.project_name}-${var.environment}-code-storage"
}

module "api" {
  source                = "./modules/api"
  environment           = var.environment
  project_name          = local.project_name
  lambda_storage_bucket = aws_s3_bucket.code_storage.id
  cognito_user_pool_id  = var.cognito_user_pool_id
  metadata_table        = module.storage.metadata_table
  user_files_bucket     = module.storage.user_files_bucket
  inference_queue       = module.batch_inference.inference_queue
  jobs_status_table     = module.batch_inference.inference_jobs_status_table
  output_bucket         = module.storage.file_process_output_bucket
}

module "client_hosting" {
  source       = "./modules/hosting"
  environment  = var.environment
  project_name = local.project_name
}

module "storage" {
  source       = "./modules/storage"
  environment  = var.environment
  project_name = local.project_name
}

module "plan_b" {
  source = "./modules/plan_b"

  environment  = var.environment
  project_name = local.project_name
}

module "batch_inference" {
  source       = "./modules/batch_inference"
  environment  = var.environment
  project_name = local.project_name

  lambda_storage_bucket = aws_s3_bucket.code_storage.id
  user_files_bucket     = module.storage.user_files_bucket
  inference_queue       = module.batch_inference.inference_queue
  jobs_status_table     = module.batch_inference.inference_jobs_status_table
  output_bucket         = module.storage.file_process_output_bucket
}

module "cloudfront" {
  source       = "./modules/cdn"
  environment  = var.environment
  project_name = local.project_name

  api_gateway_id         = module.api.api_gateway_id
  api_gateway_stage_name = module.api.api_gateway_stage_name

  s3_bucket             = module.client_hosting.s3_bucket
  s3_bucket_domain_name = module.client_hosting.s3_bucket_domain_name
}
