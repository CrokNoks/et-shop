# Spécifications techniques — Listes de courses

## Stack

- Backend : NestJS 11, service pattern (pas Clean Architecture — contrairement à `loyalty-cards`)
- Frontend : Next.js 16 App Router, Client Component (`"use client"`)
- Base de données : Supabase (PostgreSQL) + RLS
- Pas de Clean Architecture sur ce module : logique métier directement dans `ShoppingListsService`

---

## Architecture

```
apps/api/src/shopping-lists/
├── shopping-lists.controller.ts   — Tous les endpoints (catalogue, catégories, listes, items)
├── shopping-lists.service.ts      — Logique métier + requêtes Supabase
└── shopping-lists.module.ts       — Injection RecordPurchaseUseCase, CancelPurchaseUseCase

apps/web/src/
├── app/page.tsx                   — Page principale ("use client")
├── components/shopping/
│   ├── HopInput.tsx               — Saisie rapide avec autocomplétion
│   ├── ShoppingList.tsx           — Affichage des articles de la liste
│   ├── ListHeader.tsx             — En-tête avec nom et magasin de la liste
│   └── ProductForm.tsx            — Formulaire de modification d'un article
└── components/catalog/
    ├── CatalogSearch.tsx          — Recherche dans le catalogue
    ├── CatalogItemCard.tsx        — Fiche article du catalogue
    └── CatalogImportWizard.tsx    — Assistant d'import CSV
```

---

## API

Tous les endpoints requièrent Bearer auth + `x-household-id`.

### Listes

```
GET    /shopping-lists                     → ShoppingList[]
POST   /shopping-lists                     Body: { name }
GET    /shopping-lists/:id                 → Liste avec items imbriqués (+ catalog + catégorie + magasin)
PATCH  /shopping-lists/:id                 Body: { name?, store_id? }
DELETE /shopping-lists/:id
```

### Articles d'une liste

```
POST   /shopping-lists/:id/items           Body: { name, quantity?, barcode?, category_id?, unit?, store_id?, catalog_item_id? }
POST   /shopping-lists/:id/barcode         Body: { barcode }
PATCH  /shopping-lists/items/:id/toggle    Body: { isChecked }
PATCH  /shopping-lists/items/:id/price     Body: { price }
PATCH  /shopping-lists/items/:id/quantity  Body: { quantity }
PATCH  /shopping-lists/items/:id/unit      Body: { unit }
PATCH  /shopping-lists/items/:id/barcode   Body: { barcode }
DELETE /shopping-lists/items/:id
PATCH  /shopping-lists/:listId/items/:itemId/purchase    Body: { price? }  → atomique
PATCH  /shopping-lists/:listId/items/:itemId/unpurchase  → 204
```

### Catalogue

```
GET    /shopping-lists/catalog             Query: storeId?  → CatalogItem[]
POST   /shopping-lists/catalog             Body: { name, barcode?, category_id?, unit?, store_id }
POST   /shopping-lists/catalog/import      Body: { items: [...], store_id }
PATCH  /shopping-lists/catalog/bulk-category  Body: { ids, category_id }
PATCH  /shopping-lists/catalog/:id         Body: { name?, barcode?, category_id?, unit? }
DELETE /shopping-lists/catalog/:id
GET    /shopping-lists/suggest/:query      → 5 articles du catalogue correspondant
```

### Catégories

```
GET    /shopping-lists/categories          Query: storeId?  → Category[]
POST   /shopping-lists/categories          Body: { name, icon?, sort_order?, store_id }
POST   /shopping-lists/categories/import   Body: { categories: [...], store_id }
PATCH  /shopping-lists/categories/:id      Body: { name?, icon?, sort_order? }
DELETE /shopping-lists/categories/:id
```

---

## Modèle de données

### `shopping_lists`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | |
| `household_id` | UUID FK → households | RLS isolation |
| `store_id` | UUID FK → stores | nullable — magasin lié |
| `color` | TEXT | défaut `#1A365D` |
| `owner_id` | UUID FK → profiles | nullable (héritage migration initiale) |

### `shopping_list_items`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `list_id` | UUID FK → shopping_lists | ON DELETE CASCADE |
| `catalog_item_id` | UUID FK → items_catalog | nullable |
| `name` | TEXT NOT NULL | snapshot au moment de l'ajout |
| `category_id` | UUID FK → categories | nullable |
| `quantity` | DECIMAL | défaut 1 |
| `unit` | TEXT | défaut `pcs` |
| `price` | DECIMAL | défaut 0 |
| `is_purchased` | BOOLEAN | défaut false (renommé depuis `is_checked`) |
| `barcode` | TEXT | nullable |

### `items_catalog`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | UNIQUE (name, store_id) |
| `household_id` | UUID FK → households | |
| `store_id` | UUID FK → stores | |
| `category_id` | UUID FK → categories | nullable |
| `barcode` | TEXT | nullable |
| `unit` | TEXT | |

### `categories`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | UNIQUE (name, store_id) |
| `household_id` | UUID FK → households | |
| `store_id` | UUID FK → stores | |
| `icon` | TEXT | emoji, défaut `📦` |
| `sort_order` | INTEGER | défaut 0 |

---

## Comportements notables du service

### Résolution du magasin lors de l'ajout d'un article

Si `store_id` n'est pas fourni dans le payload d'ajout :
1. Lit le `store_id` de la liste
2. Si absent, cherche le premier magasin du foyer
3. Si toujours absent → `BadRequestException`

### Logique de dédoublonnage

Si l'article (résolu par `catalog_item_id` ou par nom dans le catalogue du magasin) existe déjà dans la liste : la quantité est incrémentée et `is_purchased` repasse à `false`.

### Création automatique au catalogue

Si l'article n'existe pas dans le catalogue du magasin lors d'un ajout par nom, il est créé automatiquement (`upsert` sur `(name, store_id)`).
