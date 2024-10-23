﻿terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.72.1"
    }

  }
}

provider "aws" {
  profile = "arq-iac"
  region  = "ca-central-1"
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

module "api" {
  source       = "./modules/api"
  environment  = var.environment
  project_name = local.project_name
}

module "hosting" {
  source       = "./modules/hosting"
  environment  = var.environment
  project_name = local.project_name
}
