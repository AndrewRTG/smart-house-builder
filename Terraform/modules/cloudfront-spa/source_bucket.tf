resource "aws_s3_bucket" "source_code_bucket" {
  bucket = "${var.project_name}-source-code-bucket"

  force_destroy = false
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.source_code_bucket.id

  policy = jsonencode({
    Id      = "${var.project_name}-bucket-policy"
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "PolicyForCloudFrontPrivateContent"
        Effect   = "Allow"
        Action   = ["s3:GetObject*"]
        Resource = "${aws_s3_bucket.source_code_bucket.arn}/*"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.project_distribution.id}"
          }
        }
      }
    ]
  })
}

locals {
  build_path = "${var.build_working_dir}/${var.build_output_dir}"

  content_types = {
    ".html"  = "text/html"
    ".css"   = "text/css"
    ".js"    = "application/javascript"
    ".json"  = "application/json"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
    ".map"   = "application/json"
    ".txt"   = "text/plain"
    ".xml"   = "application/xml"
    ".webp"  = "image/webp"
  }
}
data "external" "build" {
  program     = ["node", abspath("${path.module}/scripts/build.js")]
  working_dir = var.build_working_dir

  query = merge(
    { command = var.build_command },
    var.build_environment
  )
}
resource "aws_s3_object" "build_files" {
  for_each = fileset(local.build_path, "**/*")

  depends_on   = [data.external.build]
  bucket       = aws_s3_bucket.source_code_bucket.id
  key          = each.value
  source       = "${local.build_path}/${each.value}"
  etag         = filemd5("${local.build_path}/${each.value}")
  content_type = lookup(local.content_types, regex("\\.[^.]+$", each.value), "application/octet-stream")
}
resource "terraform_data" "invalidation_trigger" {
  triggers_replace = [for k, v in aws_s3_object.build_files : v.etag]

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command     = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.project_distribution.id} --paths '/*'"
  }
}
