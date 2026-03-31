# Points d'attention — Magasins

## Comportements non-évidents

### `x-household-id` lu directement dans le controller

Contrairement aux autres modules qui délèguent la lecture du header à `SupabaseService.getHouseholdId()`, le `StoresController` lit `x-household-id` directement via `@Headers('x-household-id')`. Si le header est absent, une `BadRequestException` est levée explicitement.

### `PATCH` et `DELETE` sans filtre `household_id`

`update()` et `remove()` filtrent uniquement par `id` — ils ne vérifient pas que le magasin appartient au foyer de l'utilisateur courant. L'accès est contrôlé par RLS Supabase. Si la RLS venait à être désactivée, n'importe quel utilisateur authentifié pourrait modifier ou supprimer un magasin d'un autre foyer.

### Suppression : pertes en cascade importantes

Supprimer un magasin supprime en cascade :
- Toutes ses **catégories** (et donc les catégories de tous les articles de catalogue du foyer pour ce magasin)
- Tous ses **articles de catalogue** (les listes de courses qui référencent ces articles perdent leur `catalog_item_id`)
- Toutes les **cartes de fidélité** liées à ce magasin (de tous les utilisateurs du foyer)

Il n'y a pas de confirmation ou d'avertissement côté API.

---

## Limitations connues

- **Pas de contrainte d'unicité sur le nom** : deux magasins peuvent avoir le même nom dans un foyer
- **`PUT /stores/:id/categories`** applique les mises à jour de `sort_order` dans une boucle (une requête par catégorie) — pas de batch update en une seule requête
