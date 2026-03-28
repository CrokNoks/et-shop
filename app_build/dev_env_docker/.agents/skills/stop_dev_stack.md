# Skill: stop_dev_stack

## Objectif
Arrêter une instance (ou toutes les instances) de l'environnement de développement Docker et nettoyer les ressources associées.

## Pré-requis
- Docker >= 24 installé et démarré
- Docker Compose v2
- Répertoire de travail : racine du repo `et-shop`

## Étapes

### 1. Lire la cible

**Option A — Depuis active.json (instance courante) :**

```bash
ACTIVE_JSON=".agents/state/active.json"

PROJECT_NAME=$(python3 -c "
import json
with open('${ACTIVE_JSON}') as f:
    s = json.load(f)
print(s.get('dev_stack', {}).get('project_name', ''))
")

if [[ -z "$PROJECT_NAME" ]]; then
  echo "No active dev_stack found in active.json." >&2
  exit 1
fi

PORT_WEB="${PROJECT_NAME#etshop_}"
```

**Option B — Arrêter toutes les instances (`--all`) :**

```bash
# Trouver toutes les instances via les labels Docker
ALL_INSTANCES=$(docker ps \
  --filter "label=dev.etshop.instance" \
  --format "{{.Label \"dev.etshop.instance\"}}" \
  | sort -u)
```

### 2. Arrêter la stack

**Instance spécifique :**

```bash
bash scripts/dev-down.sh --port-web "${PORT_WEB}"
# Ajouter --clean pour supprimer aussi les volumes
# bash scripts/dev-down.sh --port-web "${PORT_WEB}" --clean
```

**Toutes les instances :**

```bash
for INSTANCE in $ALL_INSTANCES; do
  PORT="${INSTANCE#etshop_}"
  bash scripts/dev-down.sh --port-web "${PORT}"
done
```

### 3. Nettoyage réseau

Vérifie et supprime le réseau bridge isolé si aucun container ne l'utilise :

```bash
NETWORK_NAME="etshop_${FEAT:-dev_env_docker}"

if docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
  CONTAINERS=$(docker network inspect "${NETWORK_NAME}" \
    --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "")
  if [[ -z "$CONTAINERS" ]]; then
    docker network rm "${NETWORK_NAME}" 2>/dev/null && \
      echo "Removed network: ${NETWORK_NAME}" || true
  else
    echo "Network ${NETWORK_NAME} still in use by: ${CONTAINERS}"
  fi
fi
```

### 4. Mettre à jour active.json

Après l'arrêt, remets le champ `dev_stack` à `null` :

```bash
ACTIVE_JSON=".agents/state/active.json"

python3 - <<PYEOF
import json

with open("${ACTIVE_JSON}", "r") as f:
    state = json.load(f)

state["dev_stack"] = None

with open("${ACTIVE_JSON}", "w") as f:
    json.dump(state, f, indent=2)

print("active.json updated: dev_stack set to null.")
PYEOF
```

## Résultat attendu

- Tous les containers de l'instance stoppés et supprimés
- Fichier `docker/.env.<PORT_WEB>` supprimé
- Réseau bridge supprimé (si plus utilisé)
- `active.json` mis à jour : `"dev_stack": null`
