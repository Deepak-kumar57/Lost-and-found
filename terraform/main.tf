provider "aws" {
  region = var.aws_region
}

resource "aws_security_group" "lostfound_sg" {
  name        = "lostfound-sg"
  description = "Security group for Lost and Found portal"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Frontend"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "lostfound-sg"
    Project = "lost-and-found"
  }
}

resource "aws_instance" "lostfound_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.lostfound_sg.id]

  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io docker-compose-v2 git
    usermod -aG docker ubuntu
    mkdir -p /opt/lost-found-smart-portal
    chown ubuntu:ubuntu /opt/lost-found-smart-portal
    cd /opt/lost-found-smart-portal
    git clone https://github.com/Deepak-kumar57/Lost-and-found.git Lost-and-found
    chown -R ubuntu:ubuntu Lost-and-found
  EOF

  tags = {
    Name    = "lostfound-server"
    Project = "lost-and-found"
  }
}

resource "aws_eip" "lostfound_eip" {
  instance = aws_instance.lostfound_server.id
  domain   = "vpc"

  tags = {
    Name    = "lostfound-eip"
    Project = "lost-and-found"
  }
}
