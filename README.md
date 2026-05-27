# AquaManager

Monorepo fullstack para **gerenciamento de aquários domésticos**: parâmetros de água, fauna, TPAs, equipamentos e dosagens — com backend **Fastify + Prisma (PostgreSQL)**, frontend **React + Vite + Tailwind** e implantação via **Docker Swarm**.

## Estrutura

```
aquamanager/
├── docker-compose.yml          # Serviços com blocos deploy (Docker Swarm)
├── docker-compose.dev.yml      # Override local (Compose clássico)
├── packages/
│   ├── api/
│   └── web/
└── README.md
```

## Pré-requisitos

- **Node.js 20+**
- **PostgreSQL 16**
- Para Swarm em produção: cluster `docker swarm init` (redes `overlay`)

## Variáveis de ambiente

Copie `.env.example` para `.env` na raiz (e ajuste). A API exige `JWT_SECRET` e `JWT_REFRESH_SECRET` com **no mínimo 32 caracteres**.

## Desenvolvimento local

### 1) Banco e migrações

```bash
# Subir só o Postgres (exemplo Docker)
docker run -d --name am-pg -e POSTGRES_USER=aquamanager -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=aquamanager -p 5432:5432 postgres:16-alpine

# Na raiz, após npm install:
cp .env.example .env    # configure DATABASE_URL

cd packages/api
npx prisma migrate deploy   # ou: prisma migrate dev
npm run prisma:seed
```

### 2) API

```bash
npm run dev:api
# http://localhost:3333 — health GET /health
```

### 3) Web

O **Vite** faz proxy das chamadas `/api/*` para o backend (`vite.config.ts`), então você pode omitir `VITE_API_URL` em dev.

```bash
npm run dev:web
# http://localhost:5173
```

## Docker Compose

- **Swarm**: `docker stack deploy -c docker-compose.yml aquamanager`  
  Antes configure segredos/variáveis no ambiente ou use `docker secret` onde aplicável.

- **Local (Compose clássico)**:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Postgres fica na porta **5432** no override dev; frontend em **8080** → nginx servindo SPA.

Ao **build da imagem web**, passe `VITE_API_URL` acessível no **browser** (ex.: `http://seu-host:3333`).

## Testes

### API — unitários (padrão)

```bash
npm test -w @aquamanager/api
```

### API — integração (opcional, exige Postgres + migrações)

```bash
RUN_INTEGRATION=1 DATABASE_URL='postgresql://...' JWT_SECRET='...32+chars...' JWT_REFRESH_SECRET='...32+chars...' \
  npm run test:integration -w @aquamanager/api
```

## API / contratos

Respostas: `{ data: T }` em sucesso; erros `{ error: { message, code } }`.  
Lista paginada: `page`, `perPage` (até 100).

Principais rotas seguem o spec do projeto (`/auth`, `/aquariums`, `/test-parameters`, `/water-tests`, etc.).

## Licença

Uso interno / projeto de exemplo — ajuste conforme sua política.
