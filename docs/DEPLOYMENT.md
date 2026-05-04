# Deployment Guide

## Local Docker Deployment

```bash
docker compose up --build
```

## EC2 Production Deployment Flow

1. Create an EC2 instance.
2. Install Docker and Docker Compose plugin.
3. Clone the GitHub repository into `/opt/lost-found-smart-portal`.
4. Create production `.env` values or inject environment variables through Docker Compose.
5. Connect backend to AWS RDS PostgreSQL.
6. Set `USE_S3=true` and configure S3 bucket credentials through IAM.
7. Add GitHub Actions secrets.
8. Push to `main` branch.
9. GitHub Actions builds images, pushes to Docker Hub, SSHs into EC2, pulls latest images, and restarts containers.

## Production Docker Compose Note

For true production, replace the local PostgreSQL service with AWS RDS and use Docker images from Docker Hub/ECR instead of building locally.
