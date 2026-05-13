output "cloudfront_domain" {
  description = "Domeniul CloudFront pentru Frontend"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "backend_cloudfront_domain" {
  description = "Domeniul CloudFront pentru Backend (API)"
  value       = aws_cloudfront_distribution.backend.domain_name
}

output "api_gateway_url" {
  description = "URL API Gateway"
  value       = aws_apigatewayv2_stage.prod.invoke_url
}

output "cognito_client_id" {
  description = "Cognito Client ID pentru frontend"
  value       = aws_cognito_user_pool_client.app.id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "s3_frontend_bucket" {
  description = "Bucket S3 pentru build-ul React"
  value       = aws_s3_bucket.frontend.bucket
}

output "ecr_app_url" {
  description = "ECR URL pentru imaginea FastAPI"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_pdf_url" {
  description = "ECR URL pentru imaginea PDF processor"
  value       = aws_ecr_repository.pdf_processor.repository_url
}