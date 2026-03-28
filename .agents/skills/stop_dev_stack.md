# Skill: stop_dev_stack

## Objectif

Arrêter proprement une instance (ou toutes les instances) de la stack de développement et-shop, nettoyer le réseau bridge isolé, et mettre à jour `active.json`.

## Étapes

### 1. Identifier la cible

**Option A — depuis active.json** (cas standard) :

```bash
ACTIVE_JSON=".agents/state/active.json"
PROJECT_NAME=$(jq -r '.dev_stack.project_name // empty' "${ACTIVE_JSON}")
PORT_WEB=$(jq -r '.dev_stack.port_web // empty' "${ACTIVE_JSON}")
```

Si `PROJECT_NAME` est vide, demander à l'utilisateur quel port arrêter.

**Option B — arrêter toutes les instances** (si `--all` est demandé) :

```bash
ALL_INSTANCES=$(docker ps \
  --filter "label=dev.etshop.instance" \
  --format "{{.Label \"dev.etshop.instance\"}}" | sort -u)
```

### 2. Arrêter la stack

```bash
# Arrêt standard (volumes préservés)
bash scripts/dev-down.sh --port-web "${PORT_WEB}"

# Arrêt avec suppression des volumes (si --clean demandé)
bash scripts/dev-down.sh --port-web "${PORT_WEB}" --clean
```

Le script `dev-down.sh` :
- Exécute `docker compose -p <PROJECT_NAME> down [--volumes]`
- Supprime le fichier `/tmp/.env.<PROJECT_NAME>`
- Nettoie le réseau bridge s'il est vide

### 3. Vérifier l'arrêt

```bash
# Aucun container ne doit subsister avec ce label
REMAINING=$(docker ps \
  --filter "label=dev.etshop.instance=${PROJECT_NAME}" \
  --format "{{.Names}}")

if [[ -z "${REMAINING}" ]]; then
  echo "Instance ${PROJECT_NAME} arrêtée avec succès."
else
  echo "ATTENTION: Ces containers sont encore actifs: ${REMAINING}"
fi
```

### 4. Mettre à jour active.json

Remettre le champ `dev_stack` à `null` :

```bash
ACTIVE_JSON=".agents/state/active.json"
jq '.dev_stack = null' "${ACTIVE_JSON}" > "${ACTIVE_JSON}.tmp" \
  && mv "${ACTIVE_JSON}.tmp" "${ACTIVE_JSON}"
echo "active.json mis à jour (dev_stack = null)"
```

### 5. Résumé à afficher

```
Instance arrêtée : <PROJECT_NAME>
  Volumes : préservés (utiliser --clean pour les supprimer)
  Réseau  : supprimé si vide
  État    : active.json mis à jour
```

## Options

| Option | Description |
|--------|-------------|
| (aucune) | Lit PROJECT_NAME depuis active.json |
| `--all` | Arrête toutes les instances actives |
| `--clean` | Supprime aussi les volumes Docker |

## En cas d'erreur

- Si `docker compose down` échoue, forcer la suppression des containers :
  ```bash
  docker ps --filter "label=dev.etshop.instance=${PROJECT_NAME}" -q | xargs docker rm -f
  ```
- Si le réseau ne peut être supprimé, vérifier qu'aucun container ne l'utilise encore
