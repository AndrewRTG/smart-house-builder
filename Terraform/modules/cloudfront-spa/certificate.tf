resource "aws_acm_certificate" "project_certificate" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  validation_option {
    domain_name       = var.domain_name
    validation_domain = var.domain_name
  }
}

resource "aws_route53_record" "certificate_validation_records" {
  for_each = {
    for dvo in aws_acm_certificate.project_certificate.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = var.hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "project_certificate" {
  certificate_arn         = aws_acm_certificate.project_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation_records : record.fqdn]
}