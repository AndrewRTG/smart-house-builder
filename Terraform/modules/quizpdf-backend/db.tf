
resource "aws_db_subnet_group" "quiz" {
  name       = "${var.app_name}-db-subnets"
  subnet_ids = aws_subnet.public[*].id

  tags = { Name = "${var.app_name}-db-subnets" }
}

variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_security_group" "rds_sg" {
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]  
  }
}

resource "aws_db_instance" "quiz" {
  password            = var.db_password       
  publicly_accessible = false
  skip_final_snapshot = false
}

resource "aws_db_instance" "quiz" {
  identifier           = "${var.app_name}-db" 
  allocated_storage    = 20
  db_name              = "quizdb"
  engine               = "postgres"
  engine_version       = "15.17" 
  instance_class       = "db.t3.micro"
  username             = "dbadmin"
  password             = "ParolaSigura123!" 
  
  db_subnet_group_name   = aws_db_subnet_group.quiz.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  
  publicly_accessible    = true 
  skip_final_snapshot    = true

  tags = { Name = "${var.app_name}-db" }
}

output "rds_hostname" {
  value = aws_db_instance.quiz.address
}