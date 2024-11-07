output "api_gateway_id" {
  value = aws_api_gateway_rest_api.files_api.id
}

output "api_gateway_stage_name" {
  value = aws_api_gateway_stage.this.stage_name
}

output "base_url" {
  value = aws_api_gateway_stage.this.invoke_url
}

output "identity_pool_id" {
  value = data.aws_cognito_identity_pool.this.id
}

output "user_pool_client_id" {
  value = data.aws_cognito_user_pool_client.this.id
}

output "user_pool_id" {
  value = data.aws_cognito_user_pool.user_pool.id
}
