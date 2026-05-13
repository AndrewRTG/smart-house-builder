module "deaddrop_frontend" {
  source              = "./modules/cloudfront-spa"
  project_name        = "${local.resource_identifier}-quizpdf-fp-fe"
  domain_name         = "quizpdf.${local.resource_identifier}.fiipractic-2026.ro"
  hosted_zone_id      = data.aws_route53_zone.main_hosted_zone.id
  project_description = "QuizPDF — learn by solving quizzes"
  build_command       = "npm install && npm run build"
  build_working_dir   = "${path.module}/../proiect/frontend"
  build_environment = {
    "VITE_API_URL" = "https://api.quizpdf.${local.resource_identifier}.fiipractic-2026.ro"
  }

  providers = {
    aws = aws.us-east-1
  }
}

module "deaddrop_backend" {
  source = "./modules/quizpdf-backend"

  app_name           = "${local.resource_identifier}-quizpdf"
  domain_name        = "api.quizpdf.${local.resource_identifier}.fiipractic-2026.ro"
  frontend_domain    = "quizpdf.${local.resource_identifier}.fiipractic-2026.ro"
  hosted_zone_id     = data.aws_route53_zone.main_hosted_zone.id

  alert_email        = local.personal_email_addresses[0]
  ses_from_email     = "noreply@quizpdf.${local.resource_identifier}.fiipractic-2026.ro"
  ses_sender_email   = "noreply@quizpdf.${local.resource_identifier}.fiipractic-2026.ro"
  ses_sandbox_emails = local.personal_email_addresses

  # Completează cu ARN-ul real după: aws secretsmanager create-secret --name groq-api-key --secret-string "gsk_..." --region eu-central-1
  groq_api_key_arn     = var.groq_api_key_arn
  google_client_id      = var.google_client_id
  google_client_secret  = var.google_client_secret
  facebook_app_id       = var.facebook_app_id
  facebook_app_secret   = var.facebook_app_secret
  secret_key            = var.secret_key
  session_secret_key    = var.session_secret_key
  resend_api_key        = var.resend_api_key

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us-east-1
  }
}
