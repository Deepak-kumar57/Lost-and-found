# Lost & Found Smart Portal

A full-stack Lost & Found Smart Portal with React frontend, Express backend, PostgreSQL database, Docker Compose local setup, and GitHub Actions CI/CD.

## Stack

- Frontend: React + Vite
- Backend: Node.js and Express
- Database: PostgreSQL
- Auth: JWT + bcrypt
- Uploads: Local storage by default; optional AWS S3
- Containers: Docker + Docker Compose
- CI/CD: GitHub Actions

## Features Included

- User registration and login
- JWT-protected routes
- Lost item reporting
- Found item reporting
- Image upload support
- Smart search across lost and found items
- Claim request submission
- Admin dashboard
- Admin approve/reject claim workflow
- Notifications table/API
- PostgreSQL schema and seed data
- Dockerfiles for frontend and backend
- docker-compose.yml for local full-stack startup
- GitHub Actions workflow for build, image push, and EC2 deployment

## Quick Start with Docker

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:8080
- Backend health: http://localhost:5000/health
- PostgreSQL: localhost:5432

Seed users:

```text
Admin: admin@example.com / Password123!
User:  student@example.com / Password123!
```

## Local Development Without Docker

### 1. Start PostgreSQL

Create a local database named `lostfound`, then run:

```bash
psql postgresql://lostfound:lostfound@localhost:5432/lostfound -f database/schema.sql
psql postgresql://lostfound:lostfound@localhost:5432/lostfound -f database/seed.sql
```

### 2. Start Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 3. Start Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## API Overview

### Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Items

```text
GET    /api/items/search
GET    /api/items/lost
GET    /api/items/found
POST   /api/items/lost
POST   /api/items/found
PATCH  /api/items/:type/:id/status
```

### Claims

```text
GET    /api/claims
POST   /api/claims
PATCH  /api/claims/:id/status
```

### Admin

```text
GET /api/admin/dashboard
```

### Notifications

```text
GET   /api/notifications
PATCH /api/notifications/:id/read
```

## Environment Variables

Backend:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://lostfound:lostfound@localhost:5432/lostfound
JWT_SECRET=change-this-super-secret
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
USE_S3=false
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

Frontend:

```env
VITE_API_URL=http://localhost:5000
```

## CI/CD Secrets Needed

For GitHub Actions deployment, add these repository secrets:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
PROD_API_URL
EC2_HOST
EC2_USER
EC2_SSH_KEY
```

## AWS Production Notes

Recommended production mapping:

- EC2: runs Docker containers
- RDS PostgreSQL: production database
- S3: uploaded item/proof images
- CloudFront / ALB: HTTPS and public access
- CloudWatch: logs and metrics
- IAM: least-privilege access to S3/ECR/RDS resources

## Next Improvements

- Email verification and password reset
- Refresh-token rotation
- Better role management
- S3 signed URL upload flow
- Unit and integration tests
- Terraform infrastructure-as-code
- AI image matching for future lost/found matching

## Update v2: Chat + Upload Fixes

This version adds:

- In-app chat between users about a lost/found item.
- `/chat` page for conversations.
- `/chat/:id` page for messages.
- More detailed lost/found report validation errors.
- Image preview/display from uploaded files.
- Upload validation for image type and 5MB max file size.

If you already created the PostgreSQL database before this update, run:

```powershell
psql postgresql://lostfound:lostfound@localhost:5432/lostfound -f database/upgrade-v2-chat.sql
```

If you are using Docker and do not care about old test data, the clean reset is:

```powershell
docker compose down -v
docker compose up --build
```

If your lost item form still says validation failed, check that these fields are not blank:

- Item title: minimum 2 characters
- Category: minimum 2 characters
- Location: minimum 2 characters
- Date: required
- Description: minimum 5 characters

Uploaded item pictures are stored locally in `backend/uploads` when `USE_S3=false`.
