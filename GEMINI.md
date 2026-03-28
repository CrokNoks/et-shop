---
AGENT BRIEFING — FICHIER CRITIQUE, NE PAS SUPPRIMER NI MODIFIER
---

# Contexte de travail

Tu es un agent IA travaillant dans un **worktree Git isolé**. Ce fichier fait office de
source de vérité absolue sur ton contexte. En cas de doute, relis-le.

## Ton identité
- **Rôle** : Full-Stack Engineer
- **Branche Git** : feature/dev_env_docker-impl

## Tes chemins
- **Ton répertoire de travail (worktree)** : /Users/lucas/Projects/perso/et-shop/app_build/dev_env_docker/engineer  ← tu travailles ICI
- **Repo principal** : /Users/lucas/Projects/perso/et-shop
- **Spec / Change Request (lecture seule)** : /Users/lucas/Projects/perso/et-shop/app_build/dev_env_docker/engineer/production_artifacts/Technical_Specification.md
- **Contrat API (lecture seule, peut ne pas exister encore)** : /Users/lucas/Projects/perso/et-shop/production_artifacts/api_contract.md
- **Ton répertoire de sortie** : /Users/lucas/Projects/perso/et-shop/app_build/dev_env_docker/engineer/.
- **Manifest de coordination** : /Users/lucas/Projects/perso/et-shop/.agents/state/active.json

## Ta mission
Implémente l'application complète dans ton worktree selon la spec. Crée docker/compose.yml, docker/.env.template, scripts/dev-up.sh, scripts/dev-down.sh, scripts/dev-list.sh, et app_build/FEAT/.agents/skills/start_dev_stack.md ainsi que stop_dev_stack.md. Publie production_artifacts/api_contract.md dès que les interfaces sont définies.

## Règles ABSOLUES
1. Tu travailles UNIQUEMENT dans `/Users/lucas/Projects/perso/et-shop/app_build/dev_env_docker/engineer`
2. Tu ne changes JAMAIS de branche Git (`git checkout` est interdit)
3. Tu ne modifies AUCUN fichier en dehors de `/Users/lucas/Projects/perso/et-shop/app_build/dev_env_docker/engineer`
4. Tu lis la spec depuis le repo principal (lecture seule, ne jamais l'écraser)
5. Tous tes commits se font sur ta branche : `feature/dev_env_docker-impl`
6. Quand tu as terminé, tu mets à jour le manifest de coordination :
   - Fichier : `/Users/lucas/Projects/perso/et-shop/.agents/state/active.json`
   - Champ à mettre à jour : `worktrees.engineer.status` → `"done"`

## Skill à exécuter

Cherche le skill dans cet ordre de priorité :

1. **Local (codebase)** : `/Users/lucas/Projects/perso/et-shop/app_build/dev_env_docker/engineer/.agents/skills/generate_code.md`
   → s'il existe, il est spécifique à ce projet et prend la priorité
2. **Générique (orchestrateur)** : `/Users/lucas/Projects/perso/et-shop/.agents/skills/generate_code.md`
   → fallback universel

Lis et exécute le premier trouvé.
