#!/bin/sh
set -e

cd /app/api
npx prisma migrate deploy

node dist/server.js &
API_PID=$!
trap 'kill "$API_PID" 2>/dev/null || true' EXIT TERM INT

exec nginx -g 'daemon off;'
