# Change Request — Ordre des produits dans un rayon

## Contexte

`items_catalog` (catalogue de produits, scope par magasin) référence un rayon via `category_id`. Les rayons (`categories`) ont déjà un `sort_order` réordonnable par drag-and-drop (écran "Rayons" d'un magasin, `StoreCategories.tsx` + `SortableCategoryItem.tsx`, endpoint `PUT /stores/:id/categories`) — cet ordre pilote déjà le tri des rayons dans la liste de courses (mode classique et mode magasin partagent le même regroupement magasin > rayon, `useShoppingListItems.ts`).

Les **produits**, eux, n'ont aucun `sort_order` : triés alphabétiquement dans le catalogue (`findAllCatalog`), et dans un ordre non défini (celui renvoyé par Postgres, non explicite) dans la liste de courses — `useShoppingListItems.ts` ne trie les articles d'un même rayon que par `is_purchased` (non cochés d'abord), sans second critère.

## Demande

Reproduire le pattern déjà existant pour les rayons, un niveau plus bas : permettre de réordonner par drag-and-drop les produits **à l'intérieur d'un même rayon**, dans l'onglet "Produits" d'un magasin. Cet ordre doit se répercuter automatiquement sur l'affichage des articles dans la liste de courses (mode classique et mode magasin), exactement comme le fait déjà l'ordre des rayons.

## Stack détecté

- Backend : NestJS 11, module `shopping-lists` (style service, endpoints CRUD du catalogue), Supabase (Postgres + RLS).
- Frontend : Next.js 16 App Router, `@dnd-kit/core` + `@dnd-kit/sortable` (déjà utilisés pour les rayons).
- Gestionnaire de dépendances : pnpm.

## Architecture de la solution

### Base de données

Nouvelle colonne `items_catalog.sort_order INTEGER DEFAULT 0`, migration au même format que celle des rayons (`categories.sort_order`, déjà en place depuis le schéma initial).

### Backend

- `findAllCatalog` : tri secondaire par `sort_order` (au lieu du seul tri alphabétique) — `.order('sort_order', { ascending: true }).order('name', { ascending: true })`, pour que les produits nouvellement créés (valeur par défaut `0`, non encore explicitement ordonnés) restent groupés de façon prévisible entre deux réordonnancements.
- `findOne` (fetch d'une liste de courses) : le `select` embarque déjà `items_catalog(*, categories(*), stores(*))` — aucun changement de requête nécessaire, `sort_order` sera disponible dans la réponse une fois la colonne ajoutée. Le tri par rayon est fait côté frontend (voir ci-dessous), pas ici.
- **Suppression d'un produit** : aucune réindexation des `sort_order` restants — les trous dans la séquence sont sans impact (le tri ne dépend que de l'ordre relatif entre produits d'un même rayon, pas de valeurs contiguës), cohérent avec le comportement déjà accepté pour la suppression d'un rayon.
- **Changement de rayon d'un produit** (formulaire d'édition `PATCH catalog/:id`, ou assignation groupée `PATCH catalog/bulk-category`, tous deux déjà existants) : quand `category_id` change, le backend calcule et pose lui-même `sort_order = MAX(sort_order) + 1` parmi les produits du **nouveau** rayon — jamais laissé à `0` ni calculé côté frontend, pour éviter qu'un produit déplacé ne s'intercale arbitrairement.

#### Protocole de réordonnancement

Décision (passage @petit_canard) : rester strictement sur le pattern déjà en production pour les rayons plutôt que d'introduire une fonction Postgres/RPC dédiée. `updateCategoryOrders` (N updates séquentiels via le client Supabase, sans transaction explicite) tourne déjà en prod pour les rayons sans incident signalé, dans le même contexte d'usage (un écran d'admin utilisé par les membres d'un même foyer, pas un contexte à forte concurrence) — ajouter une brique supplémentaire (SQL en migration, RPC, logique dupliquée) pour ce même niveau de risque n'était pas justifié.

Nouvel endpoint `PUT /shopping-lists/catalog/order` : `{ orders: { itemId: string; sortOrder: number }[] }`, symétrique de `PUT /stores/:id/categories`. Chaque update est scopé par `.eq('category_id', categoryId)` (comme `updateCategoryOrders` scope par `store_id`) : un `itemId` qui n'appartient pas au rayon attendu ou au foyer actif n'est simplement pas affecté par son update (RLS + filtre), sans faire échouer les autres. Risque assumé et documenté, identique à celui déjà accepté pour les rayons : pas de garantie de transaction globale entre les N updates.

### Frontend

- `StoreCatalog.tsx` : remplace la grille à 2 colonnes triée alphabétiquement par une liste verticale **groupée par rayon** (un bloc par `category`, dans l'ordre déjà défini par `categories.sort_order`), chaque bloc contenant ses produits triés par `sort_order` et réordonnables par drag-and-drop (`DndContext`/`SortableContext` par rayon — un contexte de tri distinct par groupe, le drag ne doit pas pouvoir sortir un produit de son rayon actuel ; changer de rayon reste le rôle du formulaire d'édition / de l'assignation groupée déjà existants).
- Section finale "Sans rayon" (produits avec `category_id` nul) : triée par ordre alphabétique, **non réordonnable** (pas de notion d'ordre pour des produits qui n'appartiennent à aucun rayon).
- Recherche active (`searchQuery` non vide) : le drag-and-drop est désactivé sur tous les groupes tant qu'un filtre est actif — l'ordre visible d'un sous-ensemble filtré ne représente plus l'ordre réel et complet du rayon, glisser dans cet état serait trompeur. La liste reste consultable (lecture), juste non réordonnable.
- Nouveau composant `SortableCatalogItem.tsx`, sur le même modèle que `SortableCategoryItem.tsx` (poignée de drag, affichage du produit).
- `useShoppingListItems.ts` : le tri des articles à l'intérieur d'un groupe `aisle` (actuellement `is_purchased` seul) gagne un critère secondaire par `sort_order` du produit catalogue correspondant. `getCatalogInfo` lit déjà `item.items_catalog` (embarqué dans la même réponse `GET /shopping-lists/:id`, pas un fetch séparé) — `sort_order` y sera disponible dès l'ajout de la colonne, aucun nouveau contrat de données requis. Un article sans correspondance catalogue (ajout libre, ou article optimiste créé hors ligne avant sa synchronisation — `items_catalog: null` dans les deux cas) n'a pas de `sort_order` : il se trie après les articles catalogués de son rayon, par nom. Un article ajouté hors ligne peut ainsi "sauter" de position une fois synchronisé et raccordé à son vrai produit catalogue — comportement déjà accepté aujourd'hui pour le regroupement magasin/rayon de ces mêmes articles (`getCatalogInfo` retombe déjà sur "Sans magasin"/"Inconnu" tant qu'ils ne sont pas synchronisés) ; cette feature ne fait qu'étendre une dégradation temporaire déjà existante à un attribut de plus, pas une régression nouvelle.

### Points de scope explicitement écartés

- Le magasin d'un produit ne change jamais par drag-and-drop dans ce Change Request — seule sa position à l'intérieur de son rayon actuel change. Changer de rayon reste le rôle du formulaire d'édition ou de l'assignation groupée déjà existants ; le produit déplacé est alors ajouté en fin du nouveau rayon (`sort_order` = max existant + 1), comme le fait déjà `handleOpenCreate` pour un nouveau rayon.
- L'import CSV (`CatalogImportWizard`) n'est pas modifié : les produits importés arrivent avec `sort_order` par défaut (`0`), réordonnables ensuite manuellement comme n'importe quel produit.

## Périmètre des modifications

### Backend

#### Fichiers à créer
| Fichier | Description |
|---|---|
| `supabase/migrations/{timestamp}_items_catalog_add_sort_order.sql` | `ALTER TABLE items_catalog ADD COLUMN sort_order INTEGER DEFAULT 0` |

#### Fichiers à modifier
| Fichier | Modification |
|---|---|
| `apps/api/src/shopping-lists/shopping-lists.service.ts` | `findAllCatalog` : tri secondaire par `sort_order` ; `updateCategory`/`bulkUpdateCategory` (ou équivalent existant) : calcul serveur du `sort_order` en fin de rayon lors d'un changement de rayon ; nouvelle méthode `updateCatalogOrder(categoryId, orders)` (N updates séquentiels, sur le modèle de `updateCategoryOrders`) |
| `apps/api/src/shopping-lists/shopping-lists.controller.ts` | Nouvelle route `PUT catalog/order` |

### Frontend

#### Fichiers à créer
| Fichier | Description |
|---|---|
| `apps/web/src/components/stores/SortableCatalogItem.tsx` | Ligne de produit réordonnable par drag-and-drop, sur le modèle de `SortableCategoryItem.tsx` |

#### Fichiers à modifier
| Fichier | Modification |
|---|---|
| `apps/web/src/components/stores/detail/StoreCatalog.tsx` | Grille alphabétique → liste groupée par rayon, `DndContext` par groupe, désactivé si recherche active, section "Sans rayon" non réordonnable |
| `apps/web/src/hooks/useShoppingListItems.ts` | Tri secondaire par `sort_order` catalogue à l'intérieur d'un groupe `aisle` |

### Fichiers à NE PAS toucher
| Fichier | Raison |
|---|---|
| `StoreCategories.tsx` / `SortableCategoryItem.tsx` | Pattern de référence à répliquer, pas à modifier |
| `CatalogImportWizard.tsx` | Import CSV hors scope, `sort_order` par défaut suffit |

## Interfaces et contrats

```
PUT /shopping-lists/catalog/order
Body: { categoryId: string; orders: { itemId: string; sortOrder: number }[] }
Response: { success: true }
```

## Critères d'acceptance

### Backend
- La colonne `items_catalog.sort_order` existe, défaut `0`.
- `GET /shopping-lists/catalog?storeId=...` renvoie les produits triés par `sort_order` puis par nom.
- `PUT /shopping-lists/catalog/order` met à jour le `sort_order` des produits listés, scopés à `categoryId` ; un id hors de ce rayon ou hors foyer n'est simplement pas affecté, sans faire échouer le reste.
- Suppression d'un produit : aucune erreur ni réindexation requise, les autres produits du rayon gardent leur `sort_order` (trous acceptés).
- Changement de rayon d'un produit (édition ou assignation groupée) : le produit reçoit automatiquement `sort_order = MAX(sort_order) + 1` du rayon de destination, calculé côté backend.

### Frontend
- L'onglet "Produits" d'un magasin affiche les produits groupés par rayon, dans l'ordre des rayons déjà configuré.
- À l'intérieur d'un rayon, glisser-déposer un produit persiste le nouvel ordre (rechargement de la page → ordre conservé).
- Les produits sans rayon apparaissent dans une section "Sans rayon" triée alphabétiquement, sans poignée de drag.
- Une recherche active désactive le drag-and-drop (poignées visuellement inactives ou masquées) sur tous les groupes, sans empêcher la consultation.
- Échec réseau lors de l'appel `PUT catalog/order` : l'ordre affiché est annulé au profit de l'ordre serveur (recharge du catalogue, même pattern que `StoreCategories.tsx`), toast d'erreur affiché.
- Dans la liste de courses (mode classique et mode magasin), les articles d'un même rayon apparaissent dans l'ordre configuré (cochés/non-cochés reste le tri primaire, l'ordre produit est le critère secondaire).
- Un article ajouté à la liste sans correspondance catalogue (ajout libre, ou optimiste hors ligne pas encore synchronisé) se trie après les articles catalogués de son rayon.

## Risques de régression

- `StoreCatalog.tsx` change de mise en page (grille 2 colonnes → liste par groupes) : vérifier que la sélection multiple (assignation groupée de rayon) et l'édition/suppression restent fonctionnelles dans la nouvelle disposition.
- `useShoppingListItems.ts` est un hook central (budget, mode magasin) — le tri secondaire ajouté doit rester stable et ne pas raviver le bug déjà corrigé par le passé (`classic_item_order`, non-cochés d'abord).
