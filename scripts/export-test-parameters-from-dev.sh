#!/usr/bin/env bash
# Exporta EXATAMENTE o que está no Postgres de DEV (se você alterou faixas na UI).
# Uso:
#   export DATABASE_URL="postgresql://user:pass@host-dev:5432/aquamanager"
#   ./scripts/export-test-parameters-from-dev.sh > /tmp/parametros-dev.sql
# Depois no servidor de produção:
#   psql "$DATABASE_URL_PROD" -f /tmp/parametros-dev.sql

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Defina DATABASE_URL apontando para o banco de DEV." >&2
  exit 1
fi

pg_dump "$DATABASE_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --table=public.test_parameters \
  --table=public.parameter_ranges \
  --column-inserts

echo ""
echo "-- Após importar em produção, salve cada parâmetro no app (Parâmetros → Salvar)"
echo "-- para reavaliar is_within_range dos testes antigos, se necessário."
