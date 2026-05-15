
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${var.app_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "pdf_processor" {
  name              = "/aws/lambda/${var.app_name}-pdf-processor"
  retention_in_days = 14
}

locals {
  all_log_group_names = [
    aws_cloudwatch_log_group.api.name,
    aws_cloudwatch_log_group.pdf_processor.name,
  ]
}

resource "aws_cloudwatch_query_definition" "all_errors" {
  name            = "${var.app_name}/All Errors"
  log_group_names = local.all_log_group_names

  query_string = <<-EOT
    fields @timestamp, @log, @message
    | filter @message like /(?i)error|exception|fail/
    | sort @timestamp desc
    | limit 100
  EOT
}

resource "aws_cloudwatch_query_definition" "api_5xx" {
  name            = "${var.app_name}/API 5xx Responses"
  log_group_names = [aws_cloudwatch_log_group.api.name]

  query_string = <<-EOT
    fields @timestamp, @message
    | filter @message like /INTERNAL_ERROR|BEDROCK_ERROR|Unhandled error|statusCode.*5\d\d/
    | sort @timestamp desc
    | limit 50
  EOT
}

resource "aws_cloudwatch_query_definition" "cold_starts" {
  name            = "${var.app_name}/Cold Starts"
  log_group_names = local.all_log_group_names

  query_string = <<-EOT
    filter @type = "REPORT"
    | fields @log, @duration, @initDuration, @maxMemoryUsed / 1048576 as memoryUsedMB
    | filter ispresent(@initDuration)
    | sort @initDuration desc
    | limit 50
  EOT
}

resource "aws_cloudwatch_query_definition" "slow_requests" {
  name            = "${var.app_name}/Slow API Requests (>3s)"
  log_group_names = [aws_cloudwatch_log_group.api.name]

  query_string = <<-EOT
    filter @type = "REPORT"
    | fields @requestId, @duration, @billedDuration, @maxMemoryUsed / 1048576 as memoryUsedMB
    | filter @duration > 3000
    | sort @duration desc
    | limit 50
  EOT
}

resource "aws_cloudwatch_query_definition" "lambda_stats" {
  name            = "${var.app_name}/Lambda Performance Stats"
  log_group_names = local.all_log_group_names

  query_string = <<-EOT
    filter @type = "REPORT"
    | stats count() as invocations,
            avg(@duration) as avgDuration,
            max(@duration) as maxDuration,
            percentile(@duration, 99) as p99Duration,
            avg(@maxMemoryUsed / 1048576) as avgMemoryMB
      by @log
  EOT
}
