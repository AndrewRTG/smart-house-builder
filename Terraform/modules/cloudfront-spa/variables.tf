variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "domain_name" {
  description = "The domain name of the project"
  type        = string
}

variable "hosted_zone_id" {
  description = "The hosted zone id of the project"
  type        = string
}

variable "function_association" {
  description = "The function association for the CloudFront distribution"
  type = object({
    event_type   = string
    function_arn = string
  })
  default = null
}

variable "project_description" {
  description = "The description of the project"
  type        = string
}

variable "build_command" {
  description = "Shell command to build the frontend (e.g. 'npm ci && npm run build')"
  type        = string
}

variable "build_working_dir" {
  description = "Working directory for build_command"
  type        = string
}

variable "build_environment" {
  description = "Environment variables for build_command"
  type        = map(string)
  default     = {}
}

variable "build_output_dir" {
  description = "Build output directory relative to build_working_dir (default: dist)"
  type        = string
  default     = "dist"
}