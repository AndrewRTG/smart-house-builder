output "api_url" {
  description = "URL-ul principal al API-ului"
  value       = "https://api.quizpdf.damian-florentina-miha.fiipractic-2026.ro"
}

output "frontend_url" {
  description = "URL-ul unde poți accesa aplicația"
  value       = "https://quizpdf.damian-florentina-miha.fiipractic-2026.ro"
}

output "debug_api_gateway_url" {
  description = "URL-ul direct de API Gateway (din modul)"
  value       = module.deaddrop_backend.api_gateway_url
}

output "cognito_info" {
  value = {
    client_id    = module.deaddrop_backend.cognito_client_id
    user_pool_id = module.deaddrop_backend.cognito_user_pool_id
  }
}