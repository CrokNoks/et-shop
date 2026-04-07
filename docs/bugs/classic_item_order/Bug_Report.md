# Bug Report — Ordre des articles incorrect en mode classique

## Résumé
En mode classique, un article décoché ne remonte pas dans la section des non-cochés, et les nouveaux articles ajoutés depuis le catalogue apparaissent après les articles cochés au lieu d'être insérés parmi les non-cochés.

## Environnement
- Stack : TypeScript, Next.js 16, React 19, NestJS 11, Supabase (PostgreSQL)
- Environnement : dev / production
- Date de détection : 2026-04-07

## Étapes pour reproduire

**Bug 1 — Décochage :**
1. Ouvrir la liste en mode classique
2. Cocher un article (il descend correctement en bas de liste)
3. Décocher ce même article
4. Observer que l'article reste en bas de liste au lieu de remonter parmi les non-cochés

**Bug 2 — Ajout depuis le catalogue :**
1. Avoir des articles cochés dans la liste
2. Ajouter un nouveau produit depuis le catalogue
3. Observer que le nouvel article apparaît après les articles cochés au lieu d'être placé dans la section des non-cochés

## Comportement observé
- **Décochage** : l'article reste positionné en bas de liste (à la suite des cochés) après avoir été décoché
- **Ajout catalogue** : le nouvel article (non-coché) est inséré à la fin de la liste entière, après les articles cochés

## Comportement attendu
- **Décochage** : l'article doit remonter dans la section des articles non-cochés
- **Ajout catalogue** : le nouvel article (non-coché) doit apparaître dans la section des non-cochés (avant les cochés)

## Impact
- **Sévérité** : Majeur
- **Utilisateurs impactés** : Tous les utilisateurs utilisant le mode classique
- **Contournement disponible** : Non — le problème rend la liste confuse lors d'un ajout ou d'un changement d'avis sur un article

## Composant probable
`apps/web/src/components/shopping/ShoppingList.tsx`

**Piste principale** : La logique de tri/positionnement des articles dans la liste ne tient pas compte du statut `is_purchased` pour repositionner un article lors d'un changement d'état (coché → décoché) ou lors de l'ajout d'un nouvel article. L'ordre des items dans le state `items[]` n'est probablement pas recalculé après ces opérations — les items gardent leur position dans le tableau plutôt qu'être triés (non-cochés en premier, cochés en dernier).

## Contexte additionnel
- Le cochage fonctionne correctement (l'article descend en bas)
- Le problème ne concerne que le retour en arrière (décochage) et l'insertion de nouveaux articles
- La fonction `fetchItems()` est appelée après chaque action mais l'ordre retourné par le serveur détermine la position finale dans la liste
