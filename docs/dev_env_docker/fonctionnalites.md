# Fonctionnalités — Environnement de développement Docker

## Vue d'ensemble

Stack de développement local complète basée sur Docker Compose. Permet de lancer plusieurs instances indépendantes de l'application (web + api + Supabase) sans conflit de ports ni de noms de containers.

---

## Démarrer une instance (`dev-up.sh`)

```bash
bash scripts/dev-up.sh                           # ports auto-détectés
bash scripts/dev-up.sh --port-web 3000 --port-studio 54323  # ports explicites
```

Le script :
1. Détecte des ports libres si non fournis
2. Génère un fichier `.env` d'instance à partir de `docker/.env.template`
3. Lance `docker compose -p etshop_<PORT_WEB> up -d`
4. Chaque instance a son propre réseau bridge et ses propres volumes

## Arrêter une instance (`dev-down.sh`)

```bash
bash scripts/dev-down.sh --port-web 3000
```

Arrête et détruit les containers de l'instance identifiée par `PORT_WEB`. Les volumes persistent (données conservées). Passer `--clean` pour détruire les volumes également.

## Lister les instances actives (`dev-list.sh`)

```bash
bash scripts/dev-list.sh
```

Affiche les instances Docker en cours, identifiées par le label `dev.etshop.instance`.

## Instances parallèles sans conflit

Plusieurs instances peuvent tourner simultanément :
- Nommage : `etshop_<PORT_WEB>` (ex. `etshop_3000`, `etshop_3010`)
- Volumes isolés : `etshop_<PORT_WEB>_db_data`, etc.
- Réseau bridge dédié par instance

## Skills IA pour l'automatisation

Des skills agents sont disponibles pour qu'un agent IA puisse gérer la stack de manière autonome :
- `start_dev_stack.md` — détecte les ports libres, démarre la stack, exécute les migrations
- `stop_dev_stack.md` — arrête la stack et met à jour `active.json`

---

## Ce qui n'est pas inclus

- Hot-reload de l'API et du frontend dans les containers (les services sont des placeholders node/nginx — le développement se fait en dehors de Docker)
- Interface de gestion web des instances
- Support Windows natif (hors WSL2)
