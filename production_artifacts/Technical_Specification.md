# Technical Specification — Carte de Fidélité depuis la Liste des Magasins

## Executive Summary

Permettre à l'utilisateur de créer une carte de fidélité associée à un magasin directement depuis la page `/stores`, sans quitter la vue. L'action s'intègre dans chaque carte de magasin existante et s'ouvre dans un panneau latéral (Sheet) cohérent avec le design actuel.

---

## Requirements

### Fonctionnels

- **F1** — Chaque carte de magasin dans `/stores` expose un bouton "Carte de fidélité" (icône de carte).
- **F2** — Cliquer sur ce bouton ouvre un `Sheet` (panneau latéral droit) pré-lié au magasin sélectionné.
- **F3** — Le formulaire dans le Sheet contient :
  - `cardData` : numéro/code de la carte (saisie manuelle **ou** scan via caméra)
  - `barcodeFormat` : sélecteur parmi `CODE_128`, `QR_CODE`, `EAN_13`, `UNKNOWN`
  - `customColor` (optionnel) : couleur personnalisée (color picker ou input hex)
- **F4** — Le `storeId` est pré-rempli silencieusement (non affiché, transmis à l'API).
- **F5** — À la soumission, appel `POST /loyalty-cards` via le hook `useCreateLoyaltyCard`.
- **F6** — En cas de succès : toast "Carte ajoutée !", fermeture du Sheet.
- **F7** — En cas d'erreur : toast d'erreur, le Sheet reste ouvert.
- **F8** — Si le magasin possède déjà une carte, afficher une pastille indicatrice sur sa carte (optionnel, best-effort).

### Non-Fonctionnels

- **NF1** — Zéro navigation : tout se passe sur `/stores` sans redirection.
- **NF2** — Design cohérent avec l'existant : Shadcn `Sheet`, `Button`, palette `#FF6B35` / `#1A365D`, `rounded-2xl`, `font-black`.
- **NF3** — Réutilisation de `useCreateLoyaltyCard` (React Query) — pas de fetch manuel.
- **NF4** — Réutilisation du `BarcodeScanner` existant pour le scan.
- **NF5** — Utilisation de `fetchApi` de `lib/api.ts` (cohérence avec la page stores, pas le client de `lib/api/loyalty-cards.ts`).

---

## Architecture & Tech Stack

### Fichiers impactés

| Fichier | Action |
|---|---|
| `apps/web/src/app/stores/page.tsx` | Ajouter le bouton par store, le Sheet, et l'état associé |
| `apps/web/src/components/loyalty/AddLoyaltyCardForm.tsx` | Refactoriser pour accepter `storeId` en prop et adopter le design cohérent |
| `apps/web/src/hooks/useLoyaltyCards.ts` | Vérifier que `useCreateLoyaltyCard` utilise `fetchApi` de `lib/api.ts` (aligner si nécessaire) |

### Approche choisie : composant dédié avec prop `storeId`

Créer un composant `AddLoyaltyCardSheet` qui :
- Reçoit `{ storeId, storeName, open, onClose }` en props
- Gère son propre état de formulaire
- Appelle `useCreateLoyaltyCard`

Ce composant est instancié **une seule fois** dans `stores/page.tsx` et réutilisé pour tous les magasins via l'état `selectedStore`.

---

## State Management

```
stores/page.tsx
├── stores[]                     — liste des magasins (existant)
├── selectedStoreForCard: Store | null   — magasin pour lequel on crée une carte
├── isLoyaltySheetOpen: boolean  — contrôle le Sheet
└── AddLoyaltyCardSheet
    ├── cardData: string
    ├── barcodeFormat: BarcodeFormat
    ├── customColor: string
    └── showScanner: boolean
```

**Flux** :
1. Clic "Carte de fidélité" sur un store → `setSelectedStoreForCard(store)` + `setIsLoyaltySheetOpen(true)`
2. Submit → `createLoyaltyCard.mutateAsync({ storeId: selectedStore.id, ... })`
3. `onSuccess` → toast + `setIsLoyaltySheetOpen(false)`
