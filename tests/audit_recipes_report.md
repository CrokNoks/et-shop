# Rapport d'audit QA — Recettes (Recipes)
Date : 2026-03-28

## Contexte

Change Request : ajout de la fonctionnalité **Recettes** dans l'application et-shop.
Les recettes permettent de créer des modèles de produits réutilisables et de les injecter
en un clic dans une liste de courses existante, avec une règle de fusion précise.

---

## Statut global

L'agent Engineer est actuellement en cours d'exécution (`status: running`).
Ce rapport documente les critères à valider à l'issue du développement.

Les fichiers suivants ont été produits par cet agent QA :
- `tests/recipes.service.spec.ts` — tests unitaires Jest (RecipesService)
- `tests/audit_recipes_acceptance_criteria.test.ts` — vérification statique des fichiers
- `tests/audit_recipes_report.md` — ce rapport

---

## Critères d'acceptance

### Backend — Module & Fichiers

| ID | Critère | Fichier attendu |
|---|---|---|
| RCP-01 | RecipesModule existe | `apps/api/src/recipes/recipes.module.ts` |
| RCP-02 | RecipesController existe | `apps/api/src/recipes/recipes.controller.ts` |
| RCP-03 | RecipesService existe | `apps/api/src/recipes/recipes.service.ts` |
| RCP-04 | DTO create-recipe | `apps/api/src/recipes/dto/create-recipe.dto.ts` |
| RCP-05 | DTO update-recipe | `apps/api/src/recipes/dto/update-recipe.dto.ts` |
| RCP-06 | DTO add-recipe-item | `apps/api/src/recipes/dto/add-recipe-item.dto.ts` |
| RCP-07 | DTO send-to-list | `apps/api/src/recipes/dto/send-to-list.dto.ts` |
| RCP-08 | RecipesModule importé dans AppModule | `apps/api/src/app.module.ts` |

### Backend — Routes & Logique

| ID | Critère |
|---|---|
| RCP-09 | GET /recipes (findAll) |
| RCP-10 | POST /recipes (create) |
| RCP-11 | POST /recipes/:id/items (addItem) |
| RCP-12 | POST /recipes/:id/send (sendToList) |
| RCP-13 | PATCH /recipes/:id (update) |
| RCP-14 | DELETE /recipes/:id (remove) |
| RCP-15 | sendToList() méthode définie |
| RCP-16 | Fusion Rule 1 : is_checked=true → uncheck + replace |
| RCP-17 | Fusion Rule 2 : is_checked=false → additionner quantités |
| RCP-18 | Fusion Rule 3 : absent → INSERT |
| RCP-19 | SupabaseService injecté |

### Backend — Qualité

| ID | Critère |
|---|---|
| RCP-20 | class-validator sur CreateRecipeDto |
| RCP-21 | AddRecipeItemDto valide catalog_item_id + quantity |
| RCP-22 | SendToListDto valide shopping_list_id |
| RCP-23 | Pas de `any` dans recipes.service.ts |

### Frontend — Pages

| ID | Critère | Fichier attendu |
|---|---|---|
| RCP-24 | Page liste recettes | `apps/web/src/app/recipes/page.tsx` |
| RCP-25 | Loading state recettes | `apps/web/src/app/recipes/loading.tsx` |
| RCP-26 | Error boundary recettes | `apps/web/src/app/recipes/error.tsx` |
| RCP-27 | Page création recette | `apps/web/src/app/recipes/new/page.tsx` |
| RCP-28 | Page détail recette | `apps/web/src/app/recipes/[id]/page.tsx` |
| RCP-29 | Loading state détail | `apps/web/src/app/recipes/[id]/loading.tsx` |
| RCP-30 | Error boundary détail | `apps/web/src/app/recipes/[id]/error.tsx` |

### Frontend — Composants

| ID | Critère | Fichier attendu |
|---|---|---|
| RCP-31 | RecipeList.tsx | `apps/web/src/components/recipes/RecipeList.tsx` |
| RCP-32 | RecipeCard.tsx | `apps/web/src/components/recipes/RecipeCard.tsx` |
| RCP-33 | RecipeDetail.tsx | `apps/web/src/components/recipes/RecipeDetail.tsx` |
| RCP-34 | RecipeItemRow.tsx | `apps/web/src/components/recipes/RecipeItemRow.tsx` |
| RCP-35 | AddRecipeItemForm.tsx | `apps/web/src/components/recipes/AddRecipeItemForm.tsx` |
| RCP-36 | SendToListDialog.tsx | `apps/web/src/components/recipes/SendToListDialog.tsx` |

### Frontend — Hooks & API

| ID | Critère |
|---|---|
| RCP-37 | useRecipes.ts existe |
| RCP-38 | useRecipeDetail.ts existe |
| RCP-39 | sendRecipeToList() dans api.ts |
| RCP-40 | getRecipes() dans api.ts |
| RCP-41 | createRecipe() dans api.ts |
| RCP-42 | deleteRecipe() dans api.ts |
| RCP-43 | addRecipeItem() dans api.ts |

### Frontend — Types & Navigation

| ID | Critère |
|---|---|
| RCP-44 | Interface Recipe dans types/index.ts |
| RCP-45 | Interface RecipeItem dans types/index.ts |
| RCP-46 | Recipe.household_id défini (isolation) |
| RCP-47 | Lien /recipes dans Sidebar.tsx |
| RCP-48 | Icône recettes dans Sidebar.tsx |

### Base de données

| ID | Critère |
|---|---|
| RCP-49 | Migration 20260328000002_recipes.sql existe |
| RCP-50 | Table recipes créée |
| RCP-51 | Table recipe_items créée |
| RCP-52 | Politiques RLS définies |
| RCP-53 | Contrainte unique (recipe_id, catalog_item_id) |
| RCP-54 | Trigger updated_at sur recipes |

---

## Logique de fusion — Points critiques

La méthode `sendToList` est le cœur métier le plus risqué de cette feature.
Les 3 règles doivent être implémentées précisément :

### Règle 1 : Produit existant + coché (`is_checked = true`)
```
UPDATE shopping_list_items
SET is_checked = false,
    quantity   = <recipe_item.quantity>   ← REMPLACER, pas additionner
WHERE list_id = <shoppingListId>
  AND catalog_item_id = <catalog_item_id>
```
**Risque** : confondre avec la Règle 2 et additionner au lieu de remplacer.

### Règle 2 : Produit existant + non coché (`is_checked = false`)
```
UPDATE shopping_list_items
SET quantity = existing.quantity + recipe_item.quantity   ← ADDITIONNER
WHERE list_id = <shoppingListId>
  AND catalog_item_id = <catalog_item_id>
```
**Risque** : ne pas détecter l'état `is_checked` et toujours additionner.

### Règle 3 : Produit absent
```
INSERT INTO shopping_list_items (list_id, catalog_item_id, quantity, unit, ...)
VALUES (<shoppingListId>, <catalog_item_id>, <recipe_item.quantity>, ...)
```
**Risque** : oublier de passer `list_id` ou `household_id` correctement.

### Atomicité
L'opération doit être transactionnelle. Si Supabase ne supporte pas les transactions
natives dans le client JS, envisager une fonction RPC ou un traitement séquentiel avec
gestion d'erreur (rollback manuel des items déjà modifiés en cas d'échec).

---

## Risques identifiés

### 1. Isolation ménage (RLS)
- Les tables `recipes` et `recipe_items` doivent avoir des politiques RLS qui filtrent
  par `household_id` via la table `household_members`.
- Sans cela, un utilisateur pourrait lire les recettes d'un autre ménage.
- **A vérifier** : les politiques sont-elles définies pour SELECT, INSERT, UPDATE et DELETE ?

### 2. Contrainte unique (recipe_id, catalog_item_id)
- La spec impose qu'un produit ne peut apparaître qu'une fois par recette.
- Si `addItem` utilise `upsert`, vérifier que le `onConflict` cible bien cette paire.
- Si `addItem` utilise `insert`, le conflit retournera une erreur 409 — doit être géré proprement.

### 3. TypeScript strict
- L'accès à `existingItem.quantity` dans la Règle 2 doit être correctement typé.
- `Number(x) + Number(y)` est préférable à `x + y` pour éviter la concaténation de strings.

### 4. sendToList atomicité
- Si la migration ne définit pas de fonction RPC, le service itère sur les items un par un.
- En cas d'échec au 3ème item sur 5, les 2 premiers seront déjà modifiés.
- Solution recommandée : wrapper dans une Supabase RPC function ou documenter la limitation.

### 5. Régression shopping-lists
- `sendToList` accède à `shopping_list_items` — s'assurer qu'il ne perturbe pas les
  assertions des tests existants dans `shopping-lists.service.ts`.
- En particulier, la logique de `addItem` dans `ShoppingListsService` (qui additionne déjà
  les quantités) est similaire mais distincte — ne pas les mélanger.

---

## Tests unitaires produits

Le fichier `tests/recipes.service.spec.ts` couvre :

| Test | Description |
|---|---|
| `should be defined` | Sanity check — service injectable |
| `findAll: returns recipes for household` | Requête filtrée par household_id |
| `findAll: throws when no household header` | Guard BadRequestException |
| `findOne: returns recipe with items` | Jointure recipe_items incluse |
| `findOne: throws NotFoundException` | Code PGRST116 → 404 |
| `create: with name and description` | Création complète |
| `create: without description` | Champ optionnel |
| `create: throws when no household` | Guard BadRequestException |
| `update: name and description` | PATCH partiel |
| `remove: returns success` | DELETE + {success:true} |
| `addItem: with unit` | INSERT recipe_item complet |
| `addItem: without unit` | Champ unit optionnel |
| `updateItem: quantity and unit` | PATCH recipe_item |
| `removeItem: returns success` | DELETE recipe_item |
| **[RULE-1] sendToList: checked → uncheck + replace** | Cœur métier |
| **[RULE-2] sendToList: unchecked → add quantities** | Cœur métier |
| **[RULE-3] sendToList: absent → insert** | Cœur métier |
| **[RULE-MIXED] sendToList: 3 rules in one call** | Scénario intégration |
| `sendToList: throws when no household` | Guard BadRequestException |
| `sendToList: throws when recipe not found` | Guard NotFoundException |
| `sendToList: empty recipe, no error` | Cas limite — recette vide |
| `Household isolation: filters by household_id` | RLS guard |

---

## Instructions d'exécution

### Vérification statique (après le développement Engineer)
```bash
cd /Users/lucas/Projects/perso/et-shop/app_build/recipes/qa
npx ts-node tests/audit_recipes_acceptance_criteria.test.ts
```

### Tests unitaires Jest
```bash
cd /Users/lucas/Projects/perso/et-shop/app_build/main
npm test -- --testPathPattern="recipes.service.spec"
```

### Suite complète
```bash
cd /Users/lucas/Projects/perso/et-shop/app_build/main
npm test
npm run build
npm run lint
```
