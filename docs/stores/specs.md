# Spécifications techniques — Magasins

## Stack

- Backend : NestJS 11, service pattern
- Frontend : Next.js 16, Client Component (`/stores`)
- Base de données : Supabase (PostgreSQL) + RLS

---

## Architecture

```
apps/api/src/stores/
├── stores.controller.ts
├── stores.service.ts
├── stores.module.ts
└── dto/

apps/web/src/
├── app/stores/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
├── components/stores/
└── hooks/useStores.ts
```

---

## API

Tous les endpoints requièrent Bearer auth. `x-household-id` est lu depuis le header sur les endpoints de collection.

```
GET    /stores
  Header: x-household-id (requis)
  → Store[]

POST   /stores
  Header: x-household-id (requis)
  Body: { name }
  → Store

PATCH  /stores/:id
  Body: { name }
  → Store

DELETE /stores/:id
  → { success: true }

GET    /stores/:id/categories
  → Category[] (avec sort_order)

PUT    /stores/:id/categories
  Body: { orders: [{ categoryId, sortOrder }][] }
  → Category[]
```

---

## Modèle de données

### Table `stores`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | |
| `household_id` | UUID FK → households | RLS isolation |
| `created_at` | TIMESTAMPTZ | |

### Relations en cascade à la suppression d'un magasin

- `categories` → ON DELETE CASCADE
- `items_catalog` → ON DELETE CASCADE (via `store_id`)
- `shopping_lists` → store_id SET NULL (la liste persiste sans magasin)
- `loyalty_cards` → ON DELETE CASCADE
- `purchase_records` → store_id SET NULL (l'historique persiste)

---

## Configuration

Aucune variable spécifique. `x-household-id` est lu directement depuis les headers dans le controller (pattern différent des autres modules qui passent par `SupabaseService.getHouseholdId()`).
