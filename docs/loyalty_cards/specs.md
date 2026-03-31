# Spécifications techniques — Cartes de fidélité

## Stack

- Backend : NestJS 11 — **Clean Architecture** (module de référence du projet)
- Frontend : Next.js 16 App Router, Client Component
- Base de données : Supabase (PostgreSQL) + RLS sur `user_id`

Ce module est le **patron de référence** pour la Clean Architecture dans ce projet. Les autres modules (notamment `purchases`) s'en inspirent.

---

## Architecture

```
apps/api/src/loyalty-cards/
├── domain/
│   ├── loyalty-card.entity.ts           — Entité domaine (classe avec factory methods)
│   ├── loyalty-card.entity.spec.ts
│   ├── loyalty-card.repository.ts       — Interface repository
│   └── barcode-format.enum.ts           — Enum BarcodeFormat
├── application/
│   ├── create-loyalty-card.use-case.ts  — Créer une carte
│   ├── get-loyalty-cards.use-case.ts    — Lister (avec filtre storeIds)
│   ├── get-loyalty-card-by-id.use-case.ts
│   ├── update-loyalty-card.use-case.ts
│   ├── delete-loyalty-card.use-case.ts
│   └── dtos/
│       ├── create-loyalty-card.dto.ts
│       └── update-loyalty-card.dto.ts
├── infrastructure/
│   └── supabase-loyalty-card.repository.ts
└── loyalty-cards.controller.ts / loyalty-cards.module.ts

apps/web/src/
├── app/loyalty-cards/page.tsx           — Page cartes ("use client")
├── components/loyalty/
│   ├── LoyaltyCardList.tsx              — Liste des cartes
│   ├── LoyaltyCardItem.tsx              — Carte individuelle
│   ├── LoyaltyCardDisplay.tsx           — Affichage code-barres
│   ├── LoyaltyCardOverlay.tsx           — Overlay plein-écran scan
│   ├── AddLoyaltyCardForm.tsx           — Formulaire d'ajout
│   ├── AddLoyaltyCardSheet.tsx          — Bottom sheet d'ajout
│   └── BarcodeScanner.tsx              — Scanner caméra (ajout par scan)
└── hooks/useLoyaltyCards.ts
```

---

## API

Tous les endpoints requièrent Bearer auth. **Pas de `x-household-id`** — l'isolation est sur `user_id` (cartes personnelles).

```
POST   /loyalty-cards
  Body: { storeId, cardData, barcodeFormat, name?, description?, customColor?, userId (injecté) }
  → LoyaltyCard (201)

GET    /loyalty-cards
  Query: storeIds? (string CSV ou tableau)
  → LoyaltyCard[]

GET    /loyalty-cards/:id
  → LoyaltyCard | 404

PUT    /loyalty-cards/:id
  Body: { storeId?, cardData?, barcodeFormat?, name?, description?, customColor? }
  → LoyaltyCard | 404

DELETE /loyalty-cards/:id
  → 204 | 404
```

---

## Modèle de données

### Table `loyalty_cards`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → auth.users | ON DELETE CASCADE — RLS sur cette colonne |
| `store_id` | UUID FK → stores | ON DELETE CASCADE |
| `name` | TEXT | ajouté par migration `20260328000001` |
| `description` | TEXT | ajouté par migration `20260328000001` |
| `card_data` | TEXT NOT NULL | numéro ou contenu de la carte |
| `barcode_format` | TEXT NOT NULL | valeur de l'enum `BarcodeFormat` |
| `custom_color` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Enum `BarcodeFormat`

Défini dans le domaine TypeScript. Les valeurs acceptées incluent les formats courants : `EAN13`, `EAN8`, `CODE128`, `CODE39`, `QR_CODE`, `DATA_MATRIX`, etc. La liste complète est dans `barcode-format.enum.ts`.

---

## Particularités de la Clean Architecture

- L'entité `LoyaltyCard` utilise un constructeur privé avec factory methods (`create()`, `reconstitute()`)
- Le repository est une interface dans le domain — l'implémentation Supabase est dans `infrastructure/`
- Le controller injecte uniquement les use cases, pas le service
- Le `userId` n'est **pas** lu depuis un header — il est extrait de l'objet `req.user` fourni par `SupabaseAuthGuard`

---

## Configuration

Aucune variable d'environnement spécifique. Hérite de la configuration Supabase globale.
