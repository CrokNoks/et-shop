# Points d'attention — Listes de courses

## Comportements non-évidents

### `PATCH /items/:id/toggle` ne génère pas de purchase_record

`toggleItem` met directement `is_purchased` à la valeur passée, **sans passer par le module purchases**. Ce endpoint est un vestige du comportement initial (avant la feature `historique_stats`). Il peut mettre un article en état `is_purchased = true` sans créer de `purchase_record` correspondant dans l'historique.

Pour un marquage "acheté" correct, le frontend doit utiliser `PATCH /:listId/items/:itemId/purchase` (ou le module `/purchases/lists/...`).

### Deux routes pour marquer acheté

Il existe deux endpoints qui font la même chose (via le même use case injecté) :
- `PATCH /shopping-lists/:listId/items/:itemId/purchase` — sur le controller shopping-lists
- `POST /purchases/lists/:listId/items/:itemId/purchase` — sur le controller purchases

Les deux appellent `RecordPurchaseUseCase.execute()`. Le frontend peut utiliser l'un ou l'autre. Maintenir les deux est de la dette technique.

### Ordre des routes dans le controller

Le controller définit explicitement les routes statiques en premier (`/catalog`, `/categories`, `/suggest/:query`) avant les routes paramétriques (`/:id`). Changer cet ordre sans précaution peut provoquer des conflits de routing NestJS.

### `owner_id` nullable sur `shopping_lists`

La migration `20260324000005_make_owner_id_optional.sql` a rendu `owner_id` nullable. Le modèle de partage repose désormais sur `household_id` (RLS) et non sur `owner_id`. Cette colonne est conservée pour compatibilité mais n'est plus utilisée dans les requêtes.

---

## Limitations connues

- **Pas de tri par rayon en frontend** : les articles du catalogue ont un `sort_order` via leurs catégories, mais la page principale n'affiche pas les articles groupés par rayon — ils sont dans l'ordre d'ajout
- **Import catalogue** : en cas de doublon `(name, store_id)`, l'upsert met silencieusement à jour l'article existant — pas de rapport d'erreur par ligne
- **Suggestion** : limitée à 5 résultats, filtre par `household_id` mais pas par `store_id` — peut proposer des articles d'un autre magasin

---

## Risques opérationnels

### Création silencieuse au catalogue

Tout ajout d'un article inconnu crée automatiquement une entrée dans `items_catalog`. Un utilisateur peut ainsi polluer le catalogue en tapant des noms mal orthographiés. Il n'y a pas de validation ou de confirmation avant la création.

### Suppression de catégorie sans cascade sur les articles

Supprimer une catégorie met `category_id = NULL` sur les articles du catalogue et les articles de liste associés (FK `ON DELETE SET NULL`). Les articles ne sont pas supprimés, mais ils perdent leur catégorie silencieusement.

### RLS sur `shopping_list_items` sans filtre `household_id`

Les articles de liste sont isolés via la FK `list_id → shopping_lists.household_id`. La politique RLS vérifie l'accès via la liste parente — toute modification de la structure RLS des listes impacte automatiquement les items.
