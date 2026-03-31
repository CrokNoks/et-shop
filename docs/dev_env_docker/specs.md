# Spécifications techniques — Environnement de développement Docker

## Stack

- Orchestration : Docker Compose v2
- Scripting : Bash
- Dépendances requises : Docker ≥ 24, Docker Compose v2, `curl`
- Compatibilité : macOS, Linux, WSL2

---

## Architecture

```
docker/
├── compose.yml          — Définition des services (web, api, supabase stack)
├── kong.yml             — Configuration Kong API Gateway
└── volumes/             — Fichiers de configuration des volumes Supabase

scripts/
├── dev-up.sh            — Démarrer une instance
├── dev-down.sh          — Arrêter une instance
└── dev-list.sh          — Lister les instances actives
```

---

## Services Docker

| Service | Image | Rôle |
|---|---|---|
| `web` | `nginx:alpine` (placeholder) | Frontend |
| `api` | `node:20-alpine` (placeholder) | Backend NestJS |
| `db` | `supabase/postgres` | PostgreSQL |
| `studio` | `supabase/studio` | Supabase Studio |
| `realtime` | `supabase/realtime` | WebSockets |
| `storage` | `supabase/storage-api` | Stockage fichiers |
| `kong` | `kong` | API Gateway Supabase |
| `inbucket` | `inbucket/inbucket` | Emails de dev |

---

## Namespacing

```
PROJECT_NAME = "etshop_<PORT_WEB>"
```

Passé via `docker compose -p etshop_<PORT_WEB>`. Garantit l'isolation entre instances :
- Réseau bridge : `etshop_<PROJECT_NAME>`
- Volumes : `etshop_<PORT_WEB>_db_data`, `etshop_<PORT_WEB>_storage_data`, etc.
- Label container : `dev.etshop.instance=etshop_<PORT_WEB>`

---

## Variables configurables

| Variable | Défaut | Description |
|---|---|---|
| `PORT_WEB` | `3000` | Port frontend |
| `PORT_API` | `3001` | Port API |
| `PORT_STUDIO` | `54323` | Supabase Studio |
| `PORT_DB` | `54322` | PostgreSQL |
| `PORT_KONG` | `54321` | Kong Gateway |
| `PORT_INBUCKET` | `54324` | Emails dev |
| `POSTGRES_PASSWORD` | `postgres` | Mot de passe DB |
| `JWT_SECRET` | `super-secret-jwt-token` | Secret JWT |
| `ANON_KEY` | *(fixe en dev)* | Clé publique Supabase |
| `SERVICE_ROLE_KEY` | *(fixe en dev)* | Clé service Supabase |

Toutes les valeurs par défaut sont dans `docker/.env.template`.

---

## Skills agents

### `app_build/main/.agents/skills/start_dev_stack.md`

Étapes exécutées par l'agent :
1. Détecter 2 ports libres (web et studio) via `lsof -i` / `ss -tlnp`
2. Générer le `.env` de l'instance
3. `docker compose -p etshop_<PORT_WEB> up -d`
4. Health check via `curl` sur Kong jusqu'à `200 OK`
5. Exécuter les migrations Supabase
6. Écrire `{ port_web, port_studio, project_name, status }` dans `active.json` (champ `dev_stack`)

### `app_build/main/.agents/skills/stop_dev_stack.md`

1. Lire `active.json` pour récupérer `PROJECT_NAME` (ou accepter `--all`)
2. `docker compose -p <PROJECT_NAME> down` (+ `--volumes` si `--clean`)
3. Nettoyer le réseau bridge
4. Mettre `dev_stack` à `null` dans `active.json`

---

## État et persistance

- L'état actif est dérivé de `docker ps --filter label=dev.etshop.instance` — pas de fichier d'état côté scripts
- Les volumes survivent à `dev-down` (données conservées entre redémarrages)
- Le skill DevOps écrit son résultat dans `.agents/state/active.json` (champ `dev_stack`)
