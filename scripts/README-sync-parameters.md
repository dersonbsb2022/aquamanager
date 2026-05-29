# Sincronizar parâmetros DEV → produção

## Opção A — Script fixo do projeto (recomendado se DEV = seed padrão)

Arquivo: [`sync-test-parameters-prod.sql`](./sync-test-parameters-prod.sql)

No servidor de **produção** (ou via Portainer/console no container Postgres):

```bash
psql "postgresql://aquamanager:SENHA@postgres:5432/aquamanager" \
  -f scripts/sync-test-parameters-prod.sql
```

- Faz **UPSERT** por `name` (não depende dos UUIDs do dev).
- Inclui todos os parâmetros e faixas do `prisma/seed.ts`.

## Opção B — Cópia exata do banco DEV (se você editou faixas na UI)

No Mac/servidor com acesso ao **DEV**:

```bash
export DATABASE_URL="postgresql://USER:PASS@host-dev:5432/aquamanager"
chmod +x scripts/export-test-parameters-from-dev.sh
./scripts/export-test-parameters-from-dev.sh > parametros-dev.sql
```

Em **produção**:

```bash
psql "postgresql://USER:PASS@host-prod:5432/aquamanager" -f parametros-dev.sql
```

**Atenção:** se os `id` dos parâmetros em produção forem diferentes e já existirem testes vinculados, prefira a **Opção A** (upsert por nome).

## Depois do SQL

1. Atualize a imagem do app se ainda não tiver a versão com reavaliação automática.
2. Em **Parâmetros**, abra cada item e clique **Salvar** uma vez (reprocessa alertas dos testes antigos).
