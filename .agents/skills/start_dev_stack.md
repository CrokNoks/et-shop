# Skill: start_dev_stack

## Objectif

Démarrer une instance complète de la stack de développement et-shop (web + api + Supabase self-hosted) sur des ports libres, puis exécuter les migrations SQL.

## Prérequis

- Docker >= 24 installé et le daemon en cours d'exécution
- Docker Compose v2 disponible (`docker compose version`)
- `curl` disponible

## Étapes

### 1. Détecter des ports libres

Détecter 2 ports libres :
- **PORT_WEB** : à partir de `3000`, incrémenter jusqu'à trouver un port libre
- **PORT_STUDIO** : à partir de `54323`, incrémenter jusqu'à trouver un port libre

```bash
# Détection macOS / Linux
find_free_port() {
  local port="$1"
  while lsof -iTCP:"${port}" -sTCP:LISTEN -t &>/dev/null 2>&1; do
    port=$((port + 1))
  done
  echo "${port}"
}

PORT_WEB=$(find_free_port 3000)
PORT_STUDIO=$(find_free_port 54323)
```

### 2. Démarrer la stack

```bash
bash scripts/dev-up.sh --port-web "${PORT_WEB}" --port-studio "${PORT_STUDIO}"
```

Le script `dev-up.sh` :
- Génère le fichier `.env` de l'instance dans `/tmp/.env.etshop_<PORT_WEB>`
- Lance `docker compose -p etshop_<PORT_WEB> up -d`
- Attend que Kong réponde sur `http://localhost:<PORT_KONG>`
- Exécute les migrations dans `supabase/migrations/*.sql`

### 3. Vérifier le démarrage

Attendre que les services principaux soient opérationnels :

```bash
# Kong health check
curl -sf "http://localhost:${PORT_KONG}" -o /dev/null && echo "Kong OK"

# Studio health check
curl -sf "http://localhost:${PORT_STUDIO}" -o /dev/null && echo "Studio OK"

# Web health check
curl -sf "http://localhost:${PORT_WEB}" -o /dev/null && echo "Web OK"
```

### 4. Rapport dans active.json

Mettre à jour le champ `dev_stack` dans `.agents/state/active.json` :

```json
{
  "dev_stack": {
    "project_name": "etshop_<PORT_WEB>",
    "port_web": <PORT_WEB>,
    "port_api": <PORT_API>,
    "port_studio": <PORT_STUDIO>,
    "port_kong": <PORT_KONG>,
    "status": "running",
    "started_at": "<ISO 8601 timestamp>"
  }
}
```

Utiliser `jq` pour mettre à jour sans écraser les autres champs :

```bash
ACTIVE_JSON=".agents/state/active.json"
PORT_API=$((PORT_WEB + 1))
PORT_KONG=$((PORT_STUDIO - 2))
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

jq --arg pn "etshop_${PORT_WEB}" \
   --argjson pw "${PORT_WEB}" \
   --argjson pa "${PORT_API}" \
   --argjson ps "${PORT_STUDIO}" \
   --argjson pk "${PORT_KONG}" \
   --arg ts "${NOW}" \
   '.dev_stack = {
     project_name: $pn,
     port_web: $pw,
     port_api: $pa,
     port_studio: $ps,
     port_kong: $pk,
     status: "running",
     started_at: $ts
   }' "${ACTIVE_JSON}" > "${ACTIVE_JSON}.tmp" && mv "${ACTIVE_JSON}.tmp" "${ACTIVE_JSON}"
```

### 5. Résumé à afficher

```
Stack démarrée : etshop_<PORT_WEB>
  Web     : http://localhost:<PORT_WEB>
  API     : http://localhost:<PORT_API>
  Studio  : http://localhost:<PORT_STUDIO>
  Kong    : http://localhost:<PORT_KONG>
  Inbucket: http://localhost:<PORT_INBUCKET>
```

## En cas d'erreur

- Si un service ne démarre pas, inspecter les logs : `docker compose -p etshop_<PORT_WEB> logs <service>`
- Si les ports sont occupés entre la détection et le démarrage, relancer la détection
- Si les migrations échouent, vérifier que le service `db` est healthy : `docker ps --filter label=dev.etshop.instance=etshop_<PORT_WEB>`
