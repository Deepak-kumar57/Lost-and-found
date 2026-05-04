#!/usr/bin/env bash
set -euo pipefail
DATABASE_URL=${DATABASE_URL:-postgresql://lostfound:lostfound@localhost:5432/lostfound}
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
