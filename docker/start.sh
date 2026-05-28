#!/bin/sh
set -e

cd /app/api

echo "Aguardando PostgreSQL e aplicando migrações..."
ok=0
i=1
while [ "$i" -le 30 ]; do
  if npx prisma migrate deploy; then
    ok=1
    break
  fi
  echo "Tentativa $i/30: banco ainda indisponível..."
  i=$((i + 1))
  sleep 2
done

if [ "$ok" -ne 1 ]; then
  echo "ERRO: não foi possível conectar ao PostgreSQL (DATABASE_URL)."
  exit 1
fi

node dist/server.js &
API_PID=$!
trap 'kill "$API_PID" 2>/dev/null || true' EXIT TERM INT

exec nginx -g 'daemon off;'
