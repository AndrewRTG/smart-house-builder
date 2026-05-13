resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project_name}-oac"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
  origin_access_control_origin_type = "s3"
}

resource "aws_cloudfront_distribution" "project_distribution" {
  depends_on = [aws_acm_certificate_validation.project_certificate]

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  origin {
    domain_name              = aws_s3_bucket.source_code_bucket.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.source_code_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  default_root_object = "index.html"

  aliases = [var.domain_name]

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    dynamic "function_association" {
      for_each = var.function_association != null ? [var.function_association] : []
      content {
        event_type   = function_association.value.event_type
        function_arn = function_association.value.function_arn
      }
    }

    target_origin_id           = aws_s3_bucket.source_code_bucket.bucket_regional_domain_name
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    origin_request_policy_id   = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin
    response_headers_policy_id = "eaab4381-ed33-4a86-88ca-d9558dc6cd63" # CORS-with-preflight-and-SecurityHeadersPolicy

    viewer_protocol_policy = "redirect-to-https"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = "PriceClass_All"

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.project_certificate.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  comment = var.project_description
}

resource "aws_route53_record" "project_distribution_a_record" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.project_distribution.domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}