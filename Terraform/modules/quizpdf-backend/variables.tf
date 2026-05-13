
variable "aws_region" {
  description = "Regiunea AWS principală"
  type        = string
  default     = "eu-central-1"
}

variable "app_name" {
  description = "Numele aplicației – prefix pentru toate resursele"
  type        = string
  default     = "quizpdf"
}

variable "domain_name" {
  description = "Domeniul API-ului (ex: api.quizpdf.example.ro)"
  type        = string
}

variable "frontend_domain" {
  description = "Domeniul frontend-ului (ex: quizpdf.example.ro) – folosit pentru CORS"
  type        = string
}

variable "hosted_zone_id" {
  description = "ID-ul zonei Route53 principale – primit din modulul root"
  type        = string
}

variable "monthly_budget_limit" {
  description = "Limita lunară buget AWS în USD"
  type        = string
  default     = "20"
}


variable "ses_from_email" {
  description = "Email verificat în SES (ex: noreply@quizpdf.ro)"
  type        = string
}

variable "ses_sender_email" {
  description = "Adresa de la care se trimit emailurile (folosită pentru identitatea SES)"
  type        = string
}

variable "ses_domain" {
  description = "Domeniu SES explicit (opțional – dacă nu e setat, se extrage din ses_sender_email)"
  type        = string
  default     = null
}

variable "ses_sandbox_emails" {
  description = "Lista de adrese verificate manual în SES sandbox"
  type        = list(string)
  default     = []
}

variable "alert_email" {
  description = "Email pentru alerte SNS și depășire buget"
  type        = string
}


variable "groq_api_key_arn" {
  description = "ARN al secretului Groq API key din Secrets Manager"
  type        = string
}


variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}


variable "facebook_app_id" {
  description = "Facebook App ID"
  type        = string
  sensitive   = true
}

variable "facebook_app_secret" {
  description = "Facebook App Secret"
  type        = string
  sensitive   = true
}
variable "secret_key" {
  type        = string
  description = "JWT Secret Key"
}

variable "session_secret_key" {
  type        = string
  description = "Session Secret Key"
}

variable "resend_api_key" {
  type        = string
  description = "Resend API Key"
}