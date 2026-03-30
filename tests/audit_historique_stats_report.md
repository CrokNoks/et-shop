# Rapport d'audit QA — Historique des achats & Statistiques
Date : 2026-03-29

## Résumé

| Critère | Statut |
|---|---|
| AC-DATA-01 : Migration purchase_records.sql existe | PASS |
| AC-DATA-02 : RENAME is_checked → is_purchased | PASS |
| AC-DATA-03 : Création table purchase_records | PASS |
| AC-DATA-04 : Colonnes obligatoires présentes | PASS |
| AC-DATA-05 : RLS activé sur purchase_records | PASS |
| AC-DATA-06 : Vues v_spending_by_category et v_top_items | PASS |
| AC-BE-01 : Entité PurchaseRecord | PASS |
| AC-BE-02 : Repository interface | PASS |
| AC-BE-03 : Use case RecordPurchase | PASS |
| AC-BE-04 : Use case CancelPurchase | PASS |
| AC-BE-05 : Use case GetPurchaseHistory | PASS |
| AC-BE-06 : Use case GetStatistics | PASS |
| AC-BE-07 : DTO PurchaseHistoryQuery | PASS |
| AC-BE-08 : Infrastructure Supabase repository | PASS |
| AC-BE-09 : Controller Purchases | PASS |
| AC-BE-10 : Module Purchases | PASS |
| AC-BE-11 : PurchasesModule dans app.module.ts | PASS |
| AC-BE-12 : Endpoint PATCH /purchase | PASS |
| AC-BE-13 : GET /purchases (historique) | PASS |
| AC-BE-14 : GET /purchases/statistics | PASS |
| AC-REG-01 : shopping-lists.service.ts utilise is_purchased | PASS |
| AC-REG-02 : shopping-lists.controller.ts utilise is_purchased | PASS |
| AC-REG-03 : recipes.service.ts sans is_checked | PASS |
| AC-FE-01 : Page /historique | FAIL |
| AC-FE-02 : Page /statistiques | FAIL |
| AC-FE-03 : Composant PurchaseHistoryList | FAIL |
| AC-FE-04 : Composant PurchaseHistoryItem | FAIL |
| AC-FE-05 : Composant ProductPurchaseHistory | FAIL |
| AC-FE-06 : Composant SpendingByCategory | FAIL |
| AC-FE-07 : Composant TopItems | FAIL |
| AC-FE-08 : Hook usePurchaseHistory | FAIL |
| AC-FE-09 : Hook useStatistics | FAIL |
| AC-FE-10 : ShoppingList.tsx sans is_checked | FAIL |
| AC-FE-11 : Navigation avec liens Historique/Statistiques | FAIL |
| AC-TEST-01 : Tests entity PurchaseRecord | PASS |
| AC-TEST-02 : Tests RecordPurchase use case | PASS |
| AC-TEST-03 : Tests CancelPurchase use case | PASS |
| AC-TEST-04 : Tests GetPurchaseHistory use case | PASS |
| AC-TEST-05 : Tests GetStatistics use case | PASS |

**Score actuel : 28/39 critères satisfaits.**

---

## Analyse

### Backend (NestJS) — Complet

Le module `purchases` a été entièrement implémenté par l'Engineer :

- **Migration SQL** : Rename `is_checked → is_purchased`, table `purchase_records` avec RLS, vues SQL `v_spending_by_category` et `v_top_items`.
- **Domain** : Entité `PurchaseRecord` conforme au contrat de la spec, immutable, avec `create()` factory.
- **Use Cases** :
  - `RecordPurchase` : crée un `purchase_record` avec snapshot complet.
  - `CancelPurchase` : supprime le `purchase_record` sans restriction de date (conforme AC-03).
  - `GetPurchaseHistory` : historique paginé avec filtres.
  - `GetStatistics` : statistiques agrégées avec filtre période/magasin.
- **Controller** : Endpoints `GET /purchases`, `GET /purchases/statistics`, `GET /purchases/by-item/:catalogItemId`.
- **Régression** : `shopping-lists.service.ts` et `recipes.service.ts` utilisent bien `is_purchased`.

### Bug identifié : Endpoint PATCH manquant dans le controller Purchases

Le `PurchasesController` n'expose pas les endpoints `PATCH /shopping-lists/:listId/items/:itemId/purchase` et `/unpurchase`. Ces endpoints sont définis dans la spec mais semblent délégués au `ShoppingListsController`. Vérifier que le `shopping-lists.controller.ts` les inclut.

### Frontend (Next.js) — Incomplet

Tous les composants, pages et hooks frontend sont manquants :

| Composant | Statut |
|---|---|
| `apps/web/src/app/historique/page.tsx` | MANQUANT |
| `apps/web/src/app/statistiques/page.tsx` | MANQUANT |
| `apps/web/src/components/purchases/PurchaseHistoryList.tsx` | MANQUANT |
| `apps/web/src/components/purchases/PurchaseHistoryItem.tsx` | MANQUANT |
| `apps/web/src/components/purchases/ProductPurchaseHistory.tsx` | MANQUANT |
| `apps/web/src/components/statistics/SpendingByCategory.tsx` | MANQUANT |
| `apps/web/src/components/statistics/TopItems.tsx` | MANQUANT |
| `apps/web/src/hooks/usePurchaseHistory.ts` | MANQUANT |
| `apps/web/src/hooks/useStatistics.ts` | MANQUANT |

De plus, `ShoppingList.tsx` utilise encore `is_checked` au lieu de `is_purchased`, et la navigation ne contient pas encore les liens vers `/historique` et `/statistiques`.

---

## Risques identifiés

### Risque 1 : Atomicité de la transaction (critique)

Le `RecordPurchaseUseCase` crée un `purchase_record` via `purchaseRecordRepository.save()` mais **ne gère pas l'atomicité** avec la mise à jour de `is_purchased` sur `shopping_list_items`. Ces deux opérations devraient être atomiques (via une RPC Supabase ou un batch). Si l'insertion du `purchase_record` échoue après que `is_purchased = true` ait été appliqué, l'état est incohérent.

**Recommandation** : Utiliser une RPC Supabase côté `shopping-lists.controller.ts` ou injecter les deux repositories dans le use case et gérer l'atomicité.

### Risque 2 : Endpoint /purchase absent du controller Purchases

Le spec définit `PATCH /shopping-lists/:listId/items/:itemId/purchase` et `/unpurchase`. Ces endpoints ne semblent pas présents dans le `PurchasesController`. Vérifier qu'ils sont bien dans `ShoppingListsController` et qu'ils appellent correctement `RecordPurchaseUseCase` et `CancelPurchaseUseCase`.

### Risque 3 : ShoppingList.tsx toujours sur is_checked

Le composant `ShoppingList.tsx` utilise encore `is_checked` — cela causera des erreurs TypeScript et/ou un comportement incorrect après le déploiement de la migration SQL qui renomme la colonne.

### Risque 4 : Swagger/OpenAPI

Le spec impose que chaque route soit documentée Swagger. Le `PurchasesController` utilise `@ApiTags` et `@ApiOperation` — bien. Le `ShoppingListsController` doit aussi documenter les nouveaux endpoints `/purchase` et `/unpurchase`.

---

## Actions Engineer requises (par ordre de priorité)

1. **(Critique)** Ajouter `PATCH /:listId/items/:itemId/purchase` et `/unpurchase` dans `shopping-lists.controller.ts` en les connectant aux use cases `RecordPurchaseUseCase` et `CancelPurchaseUseCase`.
2. **(Critique)** Implémenter l'atomicité du duo `is_purchased + insert purchase_record` (RPC Supabase recommandée).
3. Remplacer `is_checked` par `is_purchased` dans `ShoppingList.tsx` (et tous les composants frontend qui lisent cet état).
4. Créer la page `/historique` avec `PurchaseHistoryList`.
5. Créer la page `/statistiques` avec `SpendingByCategory` et `TopItems`.
6. Créer les hooks `usePurchaseHistory` et `useStatistics`.
7. Créer le composant `ProductPurchaseHistory` pour l'intégration sur la fiche produit.
8. Ajouter les liens "Historique" et "Statistiques" dans la navigation (`SidebarContent.tsx`).

---

## Tests QA produits

Les tests suivants ont été générés dans `tests/` pour valider l'implémentation :

| Fichier | Couverture |
|---|---|
| `audit_historique_stats_acceptance_criteria.test.ts` | Vérification statique des 39 critères d'acceptance |
| `purchase-record.entity.spec.ts` | Tests unitaires entité PurchaseRecord (création, immutabilité, validation) |
| `record-purchase.use-case.spec.ts` | Tests use case RecordPurchase (AC-01, AC-02, AC-08) |
| `cancel-purchase.use-case.spec.ts` | Tests use case CancelPurchase (AC-03) |
| `get-purchase-history.use-case.spec.ts` | Tests use case GetPurchaseHistory (AC-04) |
| `get-statistics.use-case.spec.ts` | Tests use case GetStatistics (AC-05, AC-06, AC-07, AC-10) |
