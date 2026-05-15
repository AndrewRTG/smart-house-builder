variable "aws_region" {
  description = "Regiunea AWS unde se creează bucket-ul"
  type        = string
  default     = "eu-central-1"
}

variable "bucket_name" {
  description = "Numele unic global al bucket-ului S3"
  type        = string
  default     = "smart-house-images"
}

variable "environment" {
  description = "Mediul de deployment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "allowed_origins" {
  description = "Origini permise pentru CORS (frontend URLs)"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "enable_versioning" {
  description = "Activează versionarea obiectelor în S3"
  type        = bool
  default     = false
}
