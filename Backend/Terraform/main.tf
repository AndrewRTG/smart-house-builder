terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "images" {
  bucket        = var.bucket_name
  force_destroy = false
  tags = {
    Project     = "SmartHouseBuilder"
    Environment = var.environment
  }
}
resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.images.id
  depends_on = [aws_s3_bucket_public_access_block.images]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })
}
resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
resource "aws_s3_bucket_versioning" "images" {
  bucket = aws_s3_bucket.images.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}
resource "aws_iam_user" "s3_app_user" {
  name = "${var.bucket_name}-app-user"

  tags = {
    Project = "SmartHouseBuilder"
  }
}

resource "aws_iam_policy" "s3_app_policy" {
  name        = "${var.bucket_name}-app-policy"
  description = "Permite backend-ului SmartHouseBuilder să scrie și să șteargă imagini"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.images.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.images.arn
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "s3_app_user_policy" {
  user       = aws_iam_user.s3_app_user.name
  policy_arn = aws_iam_policy.s3_app_policy.arn
}
resource "aws_iam_access_key" "s3_app_user_key" {
  user = aws_iam_user.s3_app_user.name
}
