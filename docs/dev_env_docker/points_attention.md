# Points d'attention — Environnement de développement Docker

## Comportements non-évidents

### Les services web et api sont des placeholders

`compose.yml` définit des containers `nginx:alpine` et `node:20-alpine` comme placeholders. En développement actif, l'API et le frontend tournent en dehors de Docker (`pnpm dev`). Les containers servent principalement à valider le réseau Docker et à simuler un environnement proche de la production.

### Les migrations ne sont pas exécutées automatiquement par `dev-up.sh`

`dev-up.sh` démarre la stack mais **n'exécute pas les migrations**. C'est le skill `start_dev_stack.md` (pour agents IA) qui prend en charge l'exécution des migrations après le health check. En dehors du pipeline agent, les migrations doivent être exécutées manuellement avec la Supabase CLI.

### Identification des instances par `PORT_WEB`

Les scripts `dev-down.sh` et `dev-list.sh` identifient les instances via le label Docker `dev.etshop.instance`. Si un container a été créé sans ce label (démarrage manuel `docker compose up` sans le script), il ne sera pas visible par `dev-list.sh` et ne sera pas arrêté par `dev-down.sh`.

---

## Limitations connues

- **Hot-reload absent** : modifier le code source ne recharge pas les containers. Le développement se fait avec `pnpm dev` en dehors de Docker.
- **`PORT_API` non auto-détecté** : seuls `PORT_WEB` et `PORT_STUDIO` sont auto-détectés par `dev-up.sh`. `PORT_API` reste fixé à `3001` par défaut — risque de conflit si une autre instance occupe ce port.
- **Windows natif non supporté** : seul WSL2 est supporté sur Windows. Les chemins et les commandes Bash ne fonctionneront pas dans PowerShell ou CMD.

---

## Risques opérationnels

### Volumes persistants entre instances

Les volumes Docker survivent à `dev-down`. Si deux instances ont été démarrées successivement sur le même `PORT_WEB`, la deuxième instance réutilisera les données de la première. Passer `--clean` pour repartir d'une base vide.

### Credentials de dev fixés

`JWT_SECRET`, `ANON_KEY` et `SERVICE_ROLE_KEY` ont des valeurs fixes dans `docker/.env.template`. Ces valeurs sont identiques pour toutes les instances de dev — intentionnel (simplicité), mais **ne jamais utiliser ces valeurs en production**.
