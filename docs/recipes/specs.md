# Spécifications techniques — Recettes

## Stack

- Backend : NestJS 11, service pattern
- Frontend : Next.js 16, Client Components
- Base de données : Supabase (PostgreSQL) + RLS par `household_id`

---

## Architecture

```
apps/api/src/recipes/
├── recipes.controller.ts
├── recipes.service.ts
├── recipes.module.ts
└── dto/
    ├── create-recipe.dto.ts
    ├── update-recipe.dto.ts
    ├── add-recipe-item.dto.ts
    └── send-to-list.dto.ts

apps/web/src/
├── app/recipes/page.tsx (probable)
├── components/recipes/
│   ├── RecipeList.tsx          — Liste des recettes du foyer
│   ├── RecipeCard.tsx          — Carte de recette
│   ├── RecipeDetail.tsx        — Détail avec items
│   ├── RecipeItemRow.tsx       — Ligne d'article de recette
│   ├── AddRecipeItemForm.tsx   — Formulaire d'ajout d'article
│   └── SendToListDialog.tsx    — Dialogue de sélection de liste
└── hooks/useRecipes.ts / useRecipeDetail.ts
```

---

## API

Tous les endpoints requièrent Bearer auth + `x-household-id`.

```
GET    /recipes                          → Recipe[] (avec count des items)
POST   /recipes                          Body: { name, description? }
GET    /recipes/:id                      → Recipe avec recipe_items imbriqués (+ catalog + catégorie + magasin)
PATCH  /recipes/:id                      Body: { name?, description? }
DELETE /recipes/:id

POST   /recipes/:id/items                Body: { catalog_item_id, quantity, unit? }
PATCH  /recipes/:id/items/:itemId        Body: { quantity?, unit? }
DELETE /recipes/:id/items/:itemId

POST   /recipes/:id/send                 Body: { shopping_list_id }
  → { success: boolean, applied: number }
```

---

## Modèle de données

### Table `recipes`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | |
| `description` | TEXT | nullable |
| `household_id` | UUID FK → households | ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Table `recipe_items`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `recipe_id` | UUID FK → recipes | ON DELETE CASCADE |
| `catalog_item_id` | UUID FK → items_catalog | ON DELETE CASCADE |
| `quantity` | DECIMAL(10,2) | défaut 1 |
| `unit` | TEXT | nullable |
| UNIQUE | (recipe_id, catalog_item_id) | un article par recette |

---

## Logique `sendToList` en détail

La méthode exécute les étapes suivantes :

1. Charger tous les `recipe_items` de la recette
2. Charger tous les `shopping_list_items` existants dans la liste cible (indexés par `catalog_item_id`)
3. Pour chaque article de la recette :
   - Si absent → préparer un **insert**
   - Si présent et `is_purchased = true` → préparer un **update** (quantity = recette, is_purchased = false)
   - Si présent et `is_purchased = false` → préparer un **update** (quantity += recette)
4. Exécuter tous les updates séquentiellement (loop), puis un insert en batch
5. Retourner `{ success: true, applied: N }`

> Les updates sont exécutés un par un dans une boucle (pas de batch update). Pour des recettes avec beaucoup d'articles, cela peut générer de nombreuses requêtes.
