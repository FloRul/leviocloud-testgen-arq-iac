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

"3c8d05d8-b091-708a-5ac1-2e53a17f3dab/a4868da3-fda8-4096-a7cb-ad633736866d/4f8c126e279c1b3ad44eed9c56acbc0e1ac7ff60afc8529276918e2ed470234f.txt"