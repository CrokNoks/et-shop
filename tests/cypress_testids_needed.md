# data-testid manquants pour les tests Cypress E2E — Feature `historique_stats`

Ce fichier liste les attributs `data-cy` (ou `data-testid`) qui doivent être ajoutés aux composants React pour que les tests Cypress de la feature `historique_stats` puissent fonctionner correctement.

## Conventions

Le projet utilise `data-cy` (pas `data-testid`). Tous les attributs ci-dessous doivent être du type `data-cy="..."`.

---

## 1. `purchase-flow.cy.ts` — Flux d'achat

### Composant : `ShoppingList.tsx`

| `data-cy` attendu | Élément cible | Note |
|---|---|---|
| `shopping-done-section` | Le `<div>` qui contient la liste des articles déjà cochés ("Déjà dans le panier") | Actuellement la section est rendue sans attribut `data-cy`. Ajouter sur le `<div className="mt-12 ...">` qui contient `doneItems`. |
| `shopping-done-item-{item.id}` | Chaque `<div>` d'item coché dans la section "Déjà dans le panier" | Ajouter `data-cy={`shopping-done-item-${item.id}`}` sur le `<div key={item.id} onClick=...>` dans la boucle `doneItems.map(...)`. |
| `shopping-progress-bar` | La barre de progression en mode shopping | Ajouter sur le `<div className="h-full bg-[var(--color-accent)]..." style={{ width: ... }}>`. |

> Les attributs `data-cy={`item-${item.id}`}`, `data-cy="shopping-mode-toggle"` et `data-cy="shopping-finish"` existent déjà dans `ShoppingList.tsx`.

---

## 2. `purchase-history.cy.ts` — Page `/historique`

### Composant : `apps/web/src/app/historique/page.tsx`

La page `/historique` ne possède pas encore de filtres visuels (par période et par magasin). Les tests supposent leur existence. Les `data-cy` suivants doivent être ajoutés **si les filtres sont implémentés dans l'UI** :

| `data-cy` attendu | Élément cible | Note |
|---|---|---|
| `history-filter-from` | Input de type `date` pour la date de début du filtre | À ajouter sur un `<input type="date" data-cy="history-filter-from">` dans la page `/historique`. |
| `history-filter-to` | Input de type `date` pour la date de fin du filtre | À ajouter sur un `<input type="date" data-cy="history-filter-to">`. |
| `history-filter-store` | `<select>` pour choisir un magasin | À ajouter sur un `<select data-cy="history-filter-store">` listant les magasins du foyer. |
| `history-filter-submit` | Bouton de validation du formulaire de filtre | À ajouter sur le `<button data-cy="history-filter-submit">` qui déclenche le rechargement. |

> **Note** : Les tests `purchase-history.cy.ts` qui testent les filtres utilisent `cy.intercept()` pour vérifier les paramètres envoyés à l'API. Si les filtres ne sont pas encore dans l'UI, ces tests échoueront proprement sur la ligne `cy.get("[data-cy=history-filter-from]").should("be.visible")`.

---

## 3. `purchase-statistics.cy.ts` — Page `/statistiques`

### Composant : `apps/web/src/app/statistiques/page.tsx`

La page statistiques utilise déjà des inputs `<input type="date">` natifs. Les tests s'appuient sur le sélecteur `input[type=date]` (premier = "Du", dernier = "Au"). Aucun `data-cy` supplémentaire n'est strictement nécessaire pour les tests existants, mais il est recommandé d'en ajouter pour la robustesse :

| `data-cy` attendu | Élément cible | Note |
|---|---|---|
| `stats-filter-from` | Input date "Du" | Optionnel mais recommandé. Remplacerait le sélecteur fragile `input[type=date]:first`. |
| `stats-filter-to` | Input date "Au" | Optionnel mais recommandé. |
| `stats-total-spent` | Le `<p>` affichant le montant total dépensé | Permet une assertion précise sur la valeur. |
| `stats-total-items` | Le `<p>` affichant le nombre total d'achats | Permet une assertion précise sur la valeur. |
| `stats-section-by-category` | Le `<section>` contenant `SpendingByCategory` | Pour scoper les assertions. |
| `stats-section-top-items` | Le `<section>` contenant `TopItems` | Pour scoper les assertions. |
| `stats-section-by-month` | Le `<section>` contenant l'évolution mensuelle | Pour scoper les assertions. |

---

## 4. `product-purchase-history.cy.ts` — Fiche produit dans le catalogue

### Composant : `StoreCatalog.tsx` + `CatalogItemCard.tsx`

| `data-cy` attendu | Élément cible | Note |
|---|---|---|
| `store-tab-catalogue` | Le bouton/onglet "Catalogue" sur la page de détail d'un magasin (`/stores/[id]`) | Ajouter sur le bouton qui active l'onglet "Catalogue" dans `apps/web/src/app/stores/[id]/page.tsx` ou dans `StoreCategories`/`StoreCatalog`. |
| `catalog-item-{item.id}` | La carte d'un article du catalogue dans `CatalogItemCard.tsx` | Ajouter `data-cy={`catalog-item-${item.id}`}` sur le `<div>` racine de `CatalogItemCard`. Actuellement ce div n'a pas de `data-cy`. |
| `product-purchase-history` | Le wrapper `<div>` racine de `ProductPurchaseHistory.tsx` | Ajouter sur le `<div className="flex flex-col gap-3">` racine du composant (ou sur le `<p>` d'état vide). |
| `purchase-history-item-{record.id}` | Chaque `<div>` d'un enregistrement d'achat dans `PurchaseHistoryItem.tsx` | Ajouter `data-cy={`purchase-history-item-${record.id}`}` sur le `<div>` racine du composant `PurchaseHistoryItem`. |

### Composant : `apps/web/src/app/stores/[id]/page.tsx`

| `data-cy` attendu | Élément cible | Note |
|---|---|---|
| `store-tab-catalogue` | Bouton de l'onglet Catalogue | Voir ci-dessus. Existe déjà `store-tab-rayons` dans `stores.cy.ts` — même convention à appliquer. |

---

## Résumé des fichiers à modifier

| Fichier composant | `data-cy` à ajouter |
|---|---|
| `apps/web/src/components/shopping/ShoppingList.tsx` | `shopping-done-section`, `shopping-done-item-{id}`, `shopping-progress-bar` |
| `apps/web/src/app/historique/page.tsx` | `history-filter-from`, `history-filter-to`, `history-filter-store`, `history-filter-submit` (si filtres ajoutés à l'UI) |
| `apps/web/src/app/statistiques/page.tsx` | `stats-filter-from`, `stats-filter-to`, `stats-total-spent`, `stats-total-items` (optionnels mais recommandés) |
| `apps/web/src/app/stores/[id]/page.tsx` | `store-tab-catalogue` |
| `apps/web/src/components/catalog/CatalogItemCard.tsx` | `catalog-item-{item.id}` |
| `apps/web/src/components/purchases/ProductPurchaseHistory.tsx` | `product-purchase-history` |
| `apps/web/src/components/purchases/PurchaseHistoryItem.tsx` | `purchase-history-item-{record.id}` |
