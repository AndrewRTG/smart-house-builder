resource "aws_s3_bucket" "quiz_results" {
  bucket = "${var.app_name}-results-storage"
}

resource "aws_s3_bucket_lifecycle_configuration" "archive_policy" {
  bucket = aws_s3_bucket.quiz_results.id

  rule {
    id     = "archive_old_results"
    status = "Enabled"
    transition {
      days          = 30
      storage_class = "GLACIER_IR" 
    }

    expiration {
      days = 365
    }
  }
}