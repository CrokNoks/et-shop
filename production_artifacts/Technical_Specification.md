# Technical Specification — `dev_env_docker`

## Executive Summary

Amélioration de l'environnement de développement local via un réseau Docker composé de trois services : **web** (frontend), **api** (backend), et **supabase** (stack complète self-hosted).
L'objectif est de permettre le lancement de **plusieurs instances** simultanées sans conflit (ports, containers, volumes), et de fournir un **skill DevOps projet** permettant à un agent IA de démarrer la stack de manière autonome sur des ports libres et d'exécuter les migrations au démarrage.

---

## Requirements

### Fonctionnels

| ID  | Exigence |
|-----|----------|
| F1  | Un script démarre un réseau Docker complet : web + api + supabase (stack complète). |
| F2  | Le port du service **web** et du **Supabase Studio** sont paramétrables à chaque démarrage. |
| F3  | Plusieurs instances peuvent tourner en parallèle sans conflit de noms ni de ports. |
| F4  | Un script arrête une instance précise (identifiée par son PORT_WEB). |
| F5  | Un script liste les instances actives avec leurs ports. |
| F6  | Un **skill DevOps projet** (`app_build/FEAT/.agents/skills/start_dev_stack.md`) permet à un agent de : (a) détecter 2 ports libres (web + studio), (b) démarrer la stack sur ces ports, (c) exécuter les migrations Supabase nécessaires. |
| F7  | Un **rôle DevOps projet** (`app_build/FEAT/.agents/agents/devops.md`) définit le comportement de l'agent chargé d'exécuter ce skill. |

### Non-fonctionnels

| ID  | Exigence |
|-----|----------|
| NF1 | Aucune dépendance autre que Docker (≥ 24), Docker Compose v2, et `curl` (présent par défaut). |
| NF2 | Namespacing via `docker compose -p <PROJECT_NAME>` pour garantir l'unicité. |
| NF3 | Volumes Supabase isolés par instance (`<PROJECT_NAME>_db_data`, etc.). |
| NF4 | Réseau Docker **bridge isolé par instance** (pas de réseau partagé entre instances). |
| NF5 | Compatible macOS, Linux, WSL2. |

---

## Architecture & Tech Stack

### Stack

| Couche | Technologie |
|--------|-------------|
| Orchestration | **Docker Compose v2** |
| Scripting | **Bash** |
| Frontend (web) | `nginx:alpine` (placeholder) |
| Backend (api) | `node:20-alpine` (placeholder) |
| Base de données + Studio | **Supabase self-hosted** (stack officielle complète via `supabase/postgres`, `supabase/studio`, `supabase/realtime`, `supabase/storage-api`, `supabase/edge-runtime`, `supabase/imgproxy`, `kong`) |

### Layout des fichiers produits

```
docker/
├── compose.yml            # définition des 3 blocs de services
└── .env.template          # toutes les variables requises avec leurs défauts

scripts/
├── dev-up.sh              # démarre une instance (détecte les ports si non fournis)
├── dev-down.sh            # arrête et détruit une instance
└── dev-list.sh            # liste les instances actives

app_build/FEAT/.agents/
├── agents/
│   └── devops.md          # rôle DevOps spécifique au projet
└── skills/
    ├── start_dev_stack.md # skill : détection ports libres + up + migrations
    └── stop_dev_stack.md  # skill : down + nettoyage réseau + màj active.json
```

---

## Namespacing des instances

```
PROJECT_NAME = "etshop_<PORT_WEB>"
# Exemples : etshop_3000, etshop_3010
```

Passé via `docker compose -p etshop_<PORT_WEB> --env-file <envfile>`.

Chaque instance possède :
- Son propre réseau bridge : `etshop_<FEAT>` (ex. `etshop_dev_env_docker`)
- Ses propres volumes : `etshop_<PORT_WEB>_db_data`, `etshop_<PORT_WEB>_storage_data`, etc.
- Un label sur chaque container : `dev.etshop.instance=etshop_<PORT_WEB>`

---

## Paramètres configurables

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT_WEB` | Port local → service web | `3000` |
| `PORT_API` | Port local → service api | `3001` |
| `PORT_STUDIO` | Port local → Supabase Studio | `54323` |
| `PORT_DB` | Port local → PostgreSQL | `54322` |
| `PORT_KONG` | Port local → Kong API Gateway | `54321` |
| `PORT_INBUCKET` | Port local → Inbucket (emails de dev) | `54324` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `postgres` |
| `JWT_SECRET` | Secret JWT Supabase | `super-secret-jwt-token` |
| `ANON_KEY` | Clé publique Supabase | *(généré ou fixe en dev)* |
| `SERVICE_ROLE_KEY` | Clé service Supabase | *(généré ou fixe en dev)* |

---

## Commandes d'usage

```bash
# Démarrer avec détection automatique des ports (script choisit les ports libres)
bash scripts/dev-up.sh

# Démarrer sur des ports explicites
bash scripts/dev-up.sh --port-web 3000 --port-studio 54323

# Lister les instances actives
bash scripts/dev-list.sh

# Arrêter l'instance web=3000
bash scripts/dev-down.sh --port-web 3000
```

---

## Skills DevOps projet

### `start_dev_stack.md`

Placé dans `app_build/FEAT/.agents/skills/start_dev_stack.md`. Étapes :

1. **Détection de ports libres** : via `ss -tlnp` / `lsof -i`, trouver 2 ports libres à partir de `3000` (web) et `54323` (studio).
2. **Génération du `.env` de l'instance** : ports trouvés + credentials de dev.
3. **Démarrage** : `docker compose -p etshop_<PORT_WEB> up -d`.
4. **Health check** : boucle `curl` sur l'endpoint Kong jusqu'à `200 OK`.
5. **Migrations** : `docker compose exec -T db psql -U postgres -f /migrations/*.sql` (ou Supabase CLI).
6. **Rapport** : écrit `{ port_web, port_studio, project_name, status }` dans `active.json` (champ `dev_stack`).

### `stop_dev_stack.md`

Placé dans `app_build/FEAT/.agents/skills/stop_dev_stack.md`. Étapes :

1. **Lecture de la cible** : lit `PROJECT_NAME` depuis `active.json` (champ `dev_stack.project_name`), ou accepte `--all` pour arrêter toutes les instances.
2. **Arrêt** : `docker compose -p <PROJECT_NAME> down` (ajoute `--volumes` si `--clean` est demandé).
3. **Nettoyage réseau** : vérifie et supprime le réseau bridge `etshop_<FEAT>` si aucun container ne l'utilise encore.
4. **Mise à jour de l'état** : met `dev_stack` à `null` dans `active.json`.

## Rôle DevOps projet — `devops.md`

```
Tu es un DevOps engineer autonome.
Tu gères le cycle de vie de l'environnement de développement local.
- Pour démarrer : exécute start_dev_stack.md
- Pour arrêter  : exécute stop_dev_stack.md
Ne modifie pas le code applicatif. Rapporte le résultat dans active.json.
```

---

## State Management

- Pas de fichier d'état persistant côté scripts : `docker ps --filter label=dev.etshop.instance` suffit.
- Le skill DevOps écrit son résultat dans `.agents/state/active.json` (champ `dev_stack`).
- Les volumes persistent entre `dev-down` / `dev-up` sauf si `--clean` est passé.
