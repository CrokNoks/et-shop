# Points d'attention — Recettes

## Comportements non-évidents

### `sendToList` écrase la quantité si l'article est déjà acheté

Si un article est marqué `is_purchased = true` dans la liste cible au moment de l'envoi, la recette **remplace** sa quantité (au lieu de l'additionner) et le repasse à `is_purchased = false`. Ce comportement est intentionnel — on repart sur la quantité de la recette. Mais il peut surprendre si l'utilisateur a manuellement ajusté la quantité après avoir acheté.

### `catalog_item_id` requis — pas de création automatique

Contrairement au module `liste_courses` qui crée des articles de catalogue à la volée, `addItem` dans les recettes requiert un `catalog_item_id` existant. L'article doit d'abord être dans le catalogue du foyer pour pouvoir être ajouté à une recette.

### Suppression en cascade sur `catalog_item_id`

La FK `recipe_items.catalog_item_id` est `ON DELETE CASCADE`. Si un article est supprimé du catalogue, tous les articles de recettes qui le référencent sont **silencieusement supprimés**.

### Pas de validation du magasin

Une recette peut contenir des articles de magasins différents. Lors de l'envoi vers une liste liée à un magasin spécifique, les articles d'autres magasins seront quand même ajoutés — sans avertissement et potentiellement dans la mauvaise liste.

---

## Limitations connues

- **Updates séquentiels dans `sendToList`** : les mises à jour existantes sont exécutées une par une (loop). Pour une recette de 20 articles, cela fait jusqu'à 20 requêtes Supabase. Pas de problème en dev, à surveiller en production.
- **Pas de gestion de l'ordre** : les articles d'une recette sont retournés dans l'ordre de création (`created_at` implicite). Aucun `sort_order` n'est défini sur `recipe_items`.
- **`updated_at` non mis à jour** lors de modifications des items — seul le champ `updated_at` de la recette elle-même pourrait être mis à jour, mais le service ne le fait pas explicitement.

---

## Risques opérationnels

### Recette orpheline après suppression du catalogue

Si tous les articles d'une recette sont supprimés du catalogue, la recette reste (avec 0 items) mais devient inutilisable. Il n'y a pas de nettoyage automatique des recettes vides.
