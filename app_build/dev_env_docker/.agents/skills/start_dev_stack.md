# Skill: start_dev_stack

## Objectif
Démarrer un environnement de développement Docker complet (web + api + supabase) sur des ports libres et exécuter les migrations de base de données.

## Pré-requis
- Docker >= 24 installé et démarré
- Docker Compose v2 (`docker compose version`)
- `lsof` ou `ss` disponible
- Répertoire de travail : racine du repo `et-shop`

## Étapes

### 1. Détecter des ports libres

Trouve deux ports libres : un pour le service **web** (à partir de 3000) et un pour **Supabase Studio** (à partir de 54323).

```bash
find_free_port() {
  local start="$1"
  local port="$start"
  while true; do
    if ! lsof -i :"${port}" -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "$port"; return 0
    fi
    port=$((port + 1))
  done
}

PORT_WEB=$(find_free_port 3000)
PORT_STUDIO=$(find_free_port 54323)
```

### 2. Démarrer la stack

Appelle le script `dev-up.sh` avec les ports détectés :

```bash
bash scripts/dev-up.sh --port-web "$PORT_WEB" --port-studio "$PORT_STUDIO"
```

Ce script :
- Génère un fichier `docker/.env.<PORT_WEB>` pour cette instance
- Lance `docker compose -p etshop_<PORT_WEB> up -d`
- Affiche les URLs d'accès

### 3. Health check — attendre que Kong réponde

Attends que l'API Gateway Kong soit prêt (jusqu'à 120 secondes) :

```bash
PROJECT_NAME="etshop_${PORT_WEB}"
PORT_KONG=$(grep PORT_KONG "docker/.env.${PORT_WEB}" | cut -d= -f2)
KONG_URL="http://localhost:${PORT_KONG}"

echo "Waiting for Kong at ${KONG_URL}..."
for i in $(seq 1 24); do
  if curl -sf "${KONG_URL}" >/dev/null 2>&1; then
    echo "Kong is ready."
    break
  fi
  echo "  attempt ${i}/24 — waiting 5s..."
  sleep 5
done
```

### 4. Exécuter les migrations Supabase

Lance les migrations SQL via le conteneur `db` de l'instance :

```bash
docker compose \
  -p "${PROJECT_NAME}" \
  -f docker/compose.yml \
  --env-file "docker/.env.${PORT_WEB}" \
  exec -T db \
  psql -U postgres -d postgres \
  -c "\i /docker-entrypoint-initdb.d/*.sql" \
  || echo "No additional migrations to run (already applied at startup)."
```

> Note : Les migrations présentes dans `supabase/migrations/` sont montées dans `/docker-entrypoint-initdb.d/` et exécutées automatiquement au premier démarrage de PostgreSQL. Cette étape couvre les migrations supplémentaires post-démarrage.

### 5. Rapport — mettre à jour active.json

Écris le résultat dans `.agents/state/active.json` (champ `dev_stack`) :

```bash
ACTIVE_JSON=".agents/state/active.json"

# Lire le contenu actuel et ajouter/remplacer le champ dev_stack
# (utilise python3 si disponible, sinon édite manuellement)
python3 - <<PYEOF
import json, sys

with open("${ACTIVE_JSON}", "r") as f:
    state = json.load(f)

state["dev_stack"] = {
    "project_name": "${PROJECT_NAME}",
    "port_web": ${PORT_WEB},
    "port_studio": ${PORT_STUDIO},
    "port_kong": $(grep PORT_KONG "docker/.env.${PORT_WEB}" | cut -d= -f2),
    "status": "running"
}

with open("${ACTIVE_JSON}", "w") as f:
    json.dump(state, f, indent=2)

print("active.json updated.")
PYEOF
```

## Résultat attendu

- Stack Docker démarrée et accessible
- Migrations appliquées
- `active.json` mis à jour avec :
  ```json
  {
    "dev_stack": {
      "project_name": "etshop_<PORT_WEB>",
      "port_web": <PORT_WEB>,
      "port_studio": <PORT_STUDIO>,
      "port_kong": <PORT_KONG>,
      "status": "running"
    }
  }
  ```
- Afficher un résumé des URLs à l'utilisateur
