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

## CI/CD (GitHub Actions)

| Workflow | Quando roda | O que faz |
|----------|-------------|-----------|
| **CI** (`.github/workflows/ci.yml`) | push/PR em `main`, tags `v*`, manual | Testes + build Docker; em push em `main` publica no **GHCR** |

Imagem gerada (mesmo padrão do `aquarium-light-controller` — **uma** imagem, tag `latest`):

- `ghcr.io/dersonbsb2022/aquamanager:latest` (API + frontend nginx no mesmo container)

No repositório GitHub: **Settings → Actions → General → Workflow permissions** → permitir leitura/escrita de pacotes (para publicar no GHCR).

Pacotes privados: no servidor Swarm, `docker login ghcr.io` com um PAT (`read:packages`).

## Docker / Swarm

### Local (Compose clássico)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Postgres na porta **5432**; frontend em **8080**.

### Produção (Swarm / Portainer + imagens do GHCR)

1. Edite `docker-compose.stack.yml` e substitua todos os valores `ALTERE_*` (senha do banco, JWT, etc.). A `DATABASE_URL` da API deve usar a **mesma** senha do `POSTGRES_PASSWORD`.
2. No **Portainer**: *Stacks* → *Add stack* → cole o conteúdo do `docker-compose.stack.yml` → *Deploy*.
3. **Registry no Portainer** (pacote GHCR costuma nascer privado):
   - *Registries* → *Add registry* → URL `ghcr.io`, usuário GitHub, senha = PAT com `read:packages`
   - Ao implantar a stack, use autenticação de registry (ou torne o pacote **Public** em GitHub → Packages → `aquamanager`)
   - No servidor: `docker pull ghcr.io/dersonbsb2022/aquamanager:latest` deve funcionar antes do deploy

Via CLI (opcional):

```bash
# edite docker-compose.stack.yml antes
docker login ghcr.io
docker stack deploy -c docker-compose.stack.yml aquamanager
```

O arquivo `.env.prod.example` é só referência — o Portainer **não** lê `.env` na stack.

O **nginx** do frontend encaminha `/api` e `/uploads` para o serviço `api` — não precisa configurar `VITE_API_URL` nas imagens oficiais.

O `docker-compose.stack.yml` usa a rede externa **`netsrv`** e labels **Traefik** (igual ao `aquarium-light-controller`). Ajuste o `Host(...)` no label do serviço `web` antes do deploy.

Migrações rodam automaticamente ao subir o container da API (`prisma migrate deploy`).

Se preferir API em URL separada (sem proxy no nginx), faça rebuild da web com `VITE_API_URL=https://api.seudominio.com`.

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
