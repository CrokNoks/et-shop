# Spécifications techniques — Historique des achats & Statistiques

## Stack

- Langage / Runtime : TypeScript strict (Node.js 20)
- Framework Backend : NestJS 11 — Clean Architecture (pattern `loyalty-cards/`)
- Framework Frontend : Next.js 16 App Router (Client Components pour les pages dynamiques)
- Base de données : Supabase (PostgreSQL) + RLS + RPCs atomiques
- Gestionnaire de dépendances : pnpm workspace

---

## Architecture

```
apps/api/src/purchases/
├── domain/
│   ├── purchase-record.entity.ts       — Entité domaine
│   └── purchase-record.repository.ts   — Interface du repository
├── application/
│   ├── record-purchase.use-case.ts     — Marquer acheté (atomique via RPC)
│   ├── cancel-purchase.use-case.ts     — Annuler un achat (atomique via RPC)
│   ├── get-purchase-history.use-case.ts — Historique paginé + filtre par item
│   ├── get-statistics.use-case.ts      — Statistiques agrégées
│   └── dtos/purchase-history-query.dto.ts
├── infrastructure/
│   └── supabase-purchase-record.repository.ts — Implémentation Supabase
└── purchases.controller.ts / purchases.module.ts

apps/web/src/
├── app/historique/page.tsx             — Page historique ("use client")
├── app/statistiques/page.tsx           — Page statistiques ("use client")
├── components/purchases/               — PurchaseHistoryList, PurchaseHistoryItem, ProductPurchaseHistory
├── components/statistics/              — SpendingByCategory, TopItems
└── hooks/usePurchaseHistory.ts / useStatistics.ts
```

---

## API

Tous les endpoints requièrent l'auth Bearer et le header `x-household-id`.

```
POST   /purchases/lists/:listId/items/:itemId/purchase
  Body: { price?: number }
  → { purchaseRecordId, purchasedAt }

DELETE /purchases/lists/:listId/items/:itemId/purchase
  → 204 No Content

GET    /purchases/history
  Query: page?, limit?, catalogItemId?, categoryId?, storeId?, from?, to?
  → { data: PurchaseRecord[], total, page, limit }

GET    /purchases/by-item/:catalogItemId
  → { records, purchaseCount, lastPurchasedAt, avgPrice }

GET    /purchases/statistics
  Query: from? (ISO 8601), to? (ISO 8601)
  → { spendingByCategory, topItems, byMonth, totalSpent, totalItems }
```

> **Écart avec la spec initiale** : les endpoints d'achat/annulation sont sur `/purchases/lists/...` (non `/shopping-lists/...`), et utilisent `POST`/`DELETE` au lieu de `PATCH`.

---

## Modèle de données

### Table `purchase_records`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `household_id` | UUID FK → households | RLS : isolation par household |
| `catalog_item_id` | UUID FK → items_catalog | nullable (SET NULL si item supprimé) |
| `shopping_list_item_id` | UUID FK → shopping_list_items | ajouté en migration post-v0 |
| `item_name` | TEXT NOT NULL | snapshot au moment de l'achat |
| `category_id` | UUID FK → categories | nullable |
| `store_id` | UUID FK → stores | nullable |
| `list_id` | UUID FK → shopping_lists | nullable |
| `quantity` | DECIMAL(10,3) | |
| `unit` | TEXT | nullable |
| `price_per_unit` | DECIMAL(10,2) | nullable — stats uniquement si renseigné |
| `purchased_at` | TIMESTAMPTZ | DEFAULT NOW() |

> `category_name` a été retiré de la table (migration `20260330000005`) — le nom de catégorie est résolu dynamiquement par JOIN sur `categories`.

### Vues SQL

- `v_spending_by_category` — dépenses par catégorie/magasin/mois (uniquement si `price_per_unit IS NOT NULL`)
- `v_top_items` — classement par fréquence d'achat par household

### RPCs atomiques

- `record_purchase_atomic(p_household_id, p_list_item_id, p_catalog_item_id, p_item_name, p_category_id, p_store_id, p_list_id, p_quantity, p_unit, p_price_per_unit)` — met à jour `is_purchased = true` ET insère le record dans une seule transaction
- `cancel_purchase_atomic(p_list_item_id, p_household_id)` — met `is_purchased = false` ET supprime le record

### Index

```sql
purchase_records_household_id_idx         ON (household_id)
purchase_records_purchased_at_idx         ON (household_id, purchased_at DESC)
purchase_records_catalog_item_id_idx      ON (household_id, catalog_item_id)
purchase_records_category_id_idx          ON (household_id, category_id)
purchase_records_shopping_list_item_idx   ON (shopping_list_item_id)
```

---

## Configuration

Aucune variable d'environnement spécifique à cette feature. Elle hérite de la configuration Supabase existante (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

Le header `x-household-id` est lu par `SupabaseService.getHouseholdId()` — il doit être envoyé par le frontend sur chaque requête.
