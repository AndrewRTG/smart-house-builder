data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.app_name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_custom" {
  name = "${var.app_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["elasticfilesystem:ClientMount", "elasticfilesystem:ClientWrite", "elasticfilesystem:ClientRootAccess"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = ["arn:aws:s3:::${var.app_name}-results-storage/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = [aws_sns_topic.alerts.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [var.groq_api_key_arn]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect   = "Allow"
        Action   = ["ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage", "ecr:GetAuthorizationToken"]
        Resource = "*"
      }
    ]
  })
}
resource "aws_lambda_function" "app" {
  function_name = var.app_name
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.app.repository_url}:latest"
  timeout       = 30
  memory_size   = 512

  environment {
  variables = {
    APP_KEYS_SECRET_ARN = var.groq_api_key_arn 
 
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    RESEND_API_KEY       = var.resend_api_key
    DATABASE_URL       = "postgresql+asyncpg://${aws_db_instance.quiz.username}:${aws_db_instance.quiz.password}@${aws_db_instance.quiz.endpoint}/${aws_db_instance.quiz.db_name}"
    ENVIRONMENT        = "prod"
    SECRET_KEY         = var.secret_key
    SESSION_SECRET_KEY = var.session_secret_key
    SES_FROM_EMAIL     = var.ses_from_email
    SNS_TOPIC_ARN      = aws_sns_topic.alerts.arn
  }
}

  depends_on = [
    aws_db_instance.quiz,
    aws_cloudwatch_log_group.api,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  lifecycle { ignore_changes = [image_uri] }
  tags = { Name = var.app_name }
}
resource "aws_lambda_function" "pdf_processor" {
  function_name = "${var.app_name}-pdf-processor"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.pdf_processor.repository_url}:latest"
  timeout       = 300
  memory_size   = 1024

  environment {
    variables = {
      DATABASE_URL       = "postgresql+asyncpg://${aws_db_instance.quiz.username}:${aws_db_instance.quiz.password}@${aws_db_instance.quiz.endpoint}/${aws_db_instance.quiz.db_name}"
      GROQ_SECRET_ARN    = var.groq_api_key_arn
      ENVIRONMENT        = "prod"
      SECRET_KEY         = var.secret_key
      SESSION_SECRET_KEY = var.session_secret_key
      SES_FROM_EMAIL     = var.ses_from_email
      SNS_TOPIC_ARN      = aws_sns_topic.alerts.arn
    }
  }
  depends_on = [
    aws_db_instance.quiz,
    aws_cloudwatch_log_group.pdf_processor,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  lifecycle { ignore_changes = [image_uri] }
  tags = { Name = "${var.app_name}-pdf-processor" }
}