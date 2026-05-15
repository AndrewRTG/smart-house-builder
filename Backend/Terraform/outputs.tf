output "bucket_name" {
  description = "Numele bucket-ului S3 creat"
  value       = aws_s3_bucket.images.bucket
}

output "bucket_arn" {
  description = "ARN-ul bucket-ului S3"
  value       = aws_s3_bucket.images.arn
}

output "bucket_regional_domain" {
  description = "URL-ul regional al bucket-ului (pentru configurarea backend-ului)"
  value       = aws_s3_bucket.images.bucket_regional_domain_name
}

output "iam_user_name" {
  description = "Numele user-ului IAM creat pentru backend"
  value       = aws_iam_user.s3_app_user.name
}

output "aws_access_key_id" {
  description = "AWS_ACCESS_KEY pentru variabila de mediu a backend-ului"
  value       = aws_iam_access_key.s3_app_user_key.id
  sensitive   = false
}

output "aws_secret_access_key" {
  description = "AWS_SECRET_KEY pentru variabila de mediu a backend-ului — păstrează-l secret!"
  value       = aws_iam_access_key.s3_app_user_key.secret
  sensitive   = true
}
