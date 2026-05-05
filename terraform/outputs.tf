output "elastic_ip" {
  description = "Public Elastic IP of the EC2 instance"
  value       = aws_eip.lostfound_eip.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.lostfound_server.id
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://${aws_eip.lostfound_eip.public_ip}:8080"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "http://${aws_eip.lostfound_eip.public_ip}:5000"
}
