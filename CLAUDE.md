# 💰 Et Shop - Project Context

# Contexte de travail

Application de gestion de liste de courses

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

Cherche le skill dans cet ordre de priorité :

1. **Domain-Driven** : Le code du domaine ne doit avoir aucune dépendance vers des frameworks externes (NestJS, TypeORM, etc.).
2. **Tests** :
   - Tests unitaires obligatoires pour la logique métier (Domaine & Use Cases).
   - Tests d'intégration pour les adaptateurs d'infrastructure (Repositories, Supabase).
3. **Validation** : Validation stricte des entrées via DTOs et utilisation de Value Objects pour les concepts métier (ex: `Amount`).
4. **Documentation API** : Chaque route doit posséder une documentation **Swagger/OpenAPI** complète (auto-générée via le module `@nestjs/swagger`).
5. **Validation Obligatoire** : Pour chaque modification du backend, les étapes suivantes doivent être validées avec succès :
   - Exécution de tous les tests (`pnpm test`).
   - Lancement du serveur de développement sans erreur (`pnpm dev`).
   - Réussite du build de production (`pnpm build`).
   - Le code est conforme au norme (`pnpm lint` et `pnpm format`).
   - Une tâche est considérée comme terminée uniquement lorsque ces quatres étapes sont validées.
6. **Commit** : Ne jamais commit sans instruction direct. Si l'utilisateur donne l'ordre de commiter :
   - tirer une branche de main après avoir mis main à jour SI et SEULEMENT SI on est sur la branche main
   - donner un nom cohérent et en lien avec les modification en cours.
   - grouper les modifications en plusieurs commit en fonction de leur impact

## Autres points

1. Informe l'utilisateur lorsque tu as chargé correctement ce fichier et les skills du projet.

## Workflow Orchestration

### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

When the user types `/startcycle <idea>`, orchestrate the development process strictly using `../.agents/agents.md` and `../.agents/skills/`.

### Execution Sequence:
1. Act as the **Product Manager** and execute the `write_specs.md` skill using the `<idea>`.
   *(Wait for the user to explicitly approve the spec. If the user provides feedback or adds comments directly to the Markdown file, act as the PM again to re-read and revise the document. Loop this step until they type "Approved").*
2. Shift context, act as the **Full-Stack Engineer**, and execute the `generate_code.md` skill.
3. Shift context, act as the **QA Engineer**, and execute the `audit_code.md` skill.
4. Shift context, act as the **DevOps Master**, and execute the `deploy_app.md` skill.


## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
