# Points d'attention — Historique des achats & Statistiques

## Comportements non-évidents

### `category_name` absent de `purchase_records`

La spec prévoyait un snapshot du nom de catégorie dans `purchase_records.category_name`. Cette colonne a été **supprimée** (migration `20260330000005`). Le nom de catégorie est désormais résolu dynamiquement par JOIN sur la table `categories` dans le repository.

**Conséquence** : si une catégorie est renommée, les anciens enregistrements refléteront le nouveau nom — pas le nom historique. Ce n'est pas un vrai snapshot.

### Prix facultatif

`price_per_unit` est nullable. Un article peut être marqué acheté sans prix renseigné. Dans ce cas :
- Il apparaît dans l'historique sans montant
- Il est **exclu** des calculs de statistiques (la vue `v_spending_by_category` filtre `WHERE price_per_unit IS NOT NULL`)
- Il est **compté** dans `totalItems` et `topItems` (fréquence d'achat, pas montant)

### Statistiques : `byMonth` peut être vide

La réponse de `/purchases/statistics` contient un tableau `byMonth`. Il est vide si aucun achat avec prix n'existe sur la période. La page frontend gère ce cas avec un `data.byMonth.length > 0`.

### Changement de route par rapport à la spec

La spec prévoyait les endpoints sur `/shopping-lists/:listId/items/:itemId/purchase`. L'implémentation finale les a placés sur `/purchases/lists/:listId/items/:itemId/purchase` avec les verbes `POST` / `DELETE` au lieu de `PATCH`. Le frontend est aligné sur l'implémentation réelle.

---

## Limitations connues

- **Filtre par catégorie** absent de la page `/historique` (le DTO supporte `categoryId` mais l'UI ne l'expose pas)
- **Pagination de `/by-item`** : récupère 100 enregistrements en dur — pas de pagination exposée en frontend
- **`averageBasket`** mentionné dans la spec (moyenne par session d'achat) est **absent** de la réponse statistiques — le calcul n'a pas été implémenté
- Pages `/historique` et `/statistiques` sont des Client Components (`"use client"`) — l'App Router ne bénéficie pas du SSR sur ces routes

---

## Dette technique

- Les pages `/historique` et `/statistiques` utilisent encore des couleurs hex hardcodées (`#1A365D`, `#FF6B35`) au lieu des variables CSS `--color-brand` / `--color-accent` introduites par la feature `nextjs_best_practices`
- Le hook `usePurchaseHistory` avec filtre `catalogItemId` et le composant `ProductPurchaseHistory` sont implémentés mais leur intégration dans la fiche produit du catalogue n'est pas visible dans la navigation principale

---

## Risques opérationnels

### Atomicité par RPC

Les opérations d'achat et d'annulation passent par des RPCs Supabase (`record_purchase_atomic`, `cancel_purchase_atomic`). Si le RPC échoue, une erreur est propagée — mais l'état de `is_purchased` dans `shopping_list_items` peut diverger si une partie de la transaction réussit en dehors du RPC.

### `shopping_list_item_id` requis côté RPC

Le RPC identifie l'article à marquer via `p_list_item_id` (`shopping_list_item_id`). Ce champ a été ajouté dans `purchase_records` post-v0 (migration `20260330000000` ne l'avait pas). Toute migration de données historiques devra tenir compte de cette colonne.

---

## Notes de mise à jour

- Renommage de `is_checked` → `is_purchased` sur `shopping_list_items` (migration `20260329000000`) — toutes les requêtes existantes du service `shopping-lists` et du frontend ont été mises à jour
- `category_name` ajoutée puis retirée dans la même session de développement — la colonne ne doit pas être recréée sans mise à jour du RPC `record_purchase_atomic`
