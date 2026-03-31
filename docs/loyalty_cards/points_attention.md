# Points d'attention — Cartes de fidélité

## Comportements non-évidents

### Isolation sur `user_id`, pas `household_id`

Contrairement à tous les autres modules, les cartes de fidélité sont isolées par **utilisateur** (`user_id = auth.uid()`), pas par foyer. Deux membres du même foyer ne partagent pas leurs cartes — chacun a sa propre liste.

**Conséquence** : le header `x-household-id` n'est pas requis sur ce module. Ne pas l'envoyer ne provoque pas d'erreur.

### `userId` injecté côté controller, pas côté client

Dans `create()`, le `userId` est forcé depuis `req.user.id` (objet injecté par le guard) :
```ts
createLoyaltyCardDto.userId = req.user.id;
```
Le client ne peut pas choisir le `userId` — toute valeur envoyée dans le body est écrasée.

### `store_id` obligatoire et doit exister

La création d'une carte exige un `store_id` valide (FK vers `stores`). Si le magasin est supprimé après la création de la carte, la carte est supprimée en cascade (`ON DELETE CASCADE`). L'utilisateur perd sa carte sans avertissement.

### Changement de propriétaire interdit

L'`UpdateLoyaltyCardUseCase` lève une erreur si une tentative de changement de `userId` est détectée (vérification de propriété explicite). Cette protection est dans le use case, pas au niveau BDD.

---

## Limitations connues

- **Pas de validation du format** : `barcode_format` est stocké comme TEXT en base — n'importe quelle chaîne est acceptée. La validation de l'enum est uniquement côté TypeScript (DTO).
- **`BarcodeScanner.tsx`** — le composant de scan caméra existe mais son intégration dans le flux d'ajout peut dépendre des permissions navigateur et n'est pas testé sur tous les appareils.
- **`name` et `description`** ont été ajoutés en migration post-initiale (`20260328000001`) — les cartes créées avant cette migration ont `name = NULL`.

---

## Module de référence

Ce module est le seul à appliquer strictement la Clean Architecture dans le projet. Avant d'ajouter une logique métier à ce module, respecter le pattern :
1. Règle métier → domain (entité ou use case)
2. Accès données → repository interface dans domain, implémentation dans infrastructure
3. Controller → use cases uniquement, pas de logique directe
