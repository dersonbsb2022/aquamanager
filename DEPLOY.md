# Deploy (Portainer / Swarm)

Referência: projeto **`aquarium-light-controller`** (funciona no mesmo servidor).

## Como o Cursor analisa os dois projetos

No menu **File → Add Folder to Workspace**, adicione:

- `/Volumes/Projetos/projetos/AquaManager`
- `/Volumes/Projetos/projetos/aquarium-light-controller`

Assim o assistente compara os dois repositórios lado a lado.

## Comparação (o que importa)

| | aquarium-light-controller | AquaManager |
|---|---------------------------|-------------|
| Repositório GitHub | `dersonbsb2022/aquarium-light-controller` | `dersonbsb2022/aquamanager` |
| **Imagem GHCR** | `ghcr.io/dersonbsb2022/aquarium-light-controller:latest` | `ghcr.io/dersonbsb2022/aquamanager:latest` |
| Workflow | push `main` → build + push com `IMAGE_NAME: ${{ github.repository }}` | Igual (job `docker` no `ci.yml`) |
| Serviços na stack | 1 app | **postgres** + **aquamanager** |
| Traefik | labels no serviço app, rede `netsrv` | Igual |

O nome da imagem é sempre **`ghcr.io/<owner>/<nome-do-repositório>:latest`**.

## Checklist Portainer

1. **Actions** verde no `main` (job `docker`).
2. GitHub → **Packages** → pacote **`aquamanager`** → tag **`latest`**.
3. No servidor: `docker pull ghcr.io/dersonbsb2022/aquamanager:latest`
4. Stack: use `portainer-stack.example.yml` (ou `docker-compose.stack.yml`).
5. Troque **todos** os `ALTERE_*` (senha do banco **igual** em `postgres` e `DATABASE_URL`).
6. JWT com **mínimo 32 caracteres** cada.
7. DNS `aqua.tmcsuporte.com.br` apontando para o servidor.

## Se o serviço reinicia em loop

- Logs do container `aquamanager`: falha comum = Postgres ainda não subiu ou `DATABASE_URL` errada.
- O `start.sh` tenta migrar até 60s; depois disso o container para com erro explícito.

## Repositório privado

O `aquarium-light` é **público**; o `aquamanager` é **privado**. O registry `dersonbsb` no Portainer precisa do mesmo PAT com **`read:packages`** (fine-grained: permissão **Packages → Read**).
