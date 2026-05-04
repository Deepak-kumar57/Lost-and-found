# Architecture

```text
User Browser
   ↓
React Frontend
   ↓ REST API
Express Backend
   ↓
PostgreSQL Database
   ↓
Claims / Items / Users / Notifications
```

Optional production services:

```text
CloudFront / HTTPS
EC2 Docker Runtime
RDS PostgreSQL
S3 Upload Storage
CloudWatch Logs
GitHub Actions CI/CD
```
