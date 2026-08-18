# Change Request — Refonte mobile du front (Et SHop!)

## Contexte
`apps/web` est une app Next.js 16 (App Router) / React 19 en Client Components, Tailwind v4 + shadcn/ui, connectée à Supabase (Postgres + RLS + Realtime `postgres_changes`). L'UI actuelle utilise une navigation en `Sidebar` desktop-first (`components/layout/Sidebar.tsx`, `SidebarContent.tsx`), une police Geist, un dark mode par classe `.dark` défini en CSS mais non branché (aucun `next-themes`, aucun toggle). Le backend (`apps/api`, NestJS) n'a pas de contrainte structurelle bloquante pour cette refonte (ex. `unit` est déjà un `string` libre en base).

Un handoff de design (Claude Design) fournit des références HTML haute-fidélité pour une refonte mobile-first (412×892), organisées en écrans identifiés (2a, 2c, 2e, 2g, 2h, 2i + pendants sombres 3a–3f, et 4a–4k), avec tokens de couleur clair/sombre, typographie (Inter), espacements, radius et une nouvelle icône d'app.

## Demande
Recréer l'intégralité du front mobile selon le handoff de design, **en un seul cycle** :
1. Tous les écrans du handoff (accueil/liste active, mode magasin plein écran, ajout d'article, foyer/listes, magasins/rayons, catalogue + import CSV, recettes, connexion, invitation, carte de fidélité, édition d'article, création de liste, états vide/skeleton).
2. Nouveaux comportements : navigation par tab bar (3 entrées : Ma liste / Magasins / Recettes), mode magasin avec sélection libre de rayon + avancement automatique au rayon suivant, thème 100 % piloté par `prefers-color-scheme` (aucun état persisté, aucun toggle).
3. **Suppression complète du code front d'Historique et de Statistiques** (pages, composants, hooks, tests e2e associés) — hors périmètre du handoff, décision explicite de tout retirer plutôt que de le laisser en dead code.

Le design (`Et SHop Mobile.dc.html`, `README.md`) fait foi pour les valeurs visuelles (couleurs, tailles, espacements) ; ce document définit le périmètre technique et les critères d'acceptance.

## Stack détecté
- Backend : NestJS 11, Supabase (Postgres + RLS + Realtime) — **inchangé**
- Frontend : Next.js 16 App Router, React 19, Client Components, Tailwind v4, shadcn/ui, `lucide-react` + `@heroicons/react`, TanStack Query
- Gestionnaire de dépendances : pnpm (workspace + turbo)

## Périmètre des modifications

### Backend
Aucun changement. Le champ `unit` (déjà `string` libre), les endpoints existants de `shopping-lists`, `stores`, `recipes`, `loyalty-cards`, `households` couvrent les besoins du design.

### Frontend

#### Fichiers à créer
| Fichier | Description |
|---|---|
| `src/components/layout/TabBar.tsx` | Nouvelle navigation mobile 3 entrées (Ma liste / Magasins / Recettes), remplace `Sidebar` |
| `src/components/shopping/AisleModeHeader.tsx` | En-tête du mode magasin (2c/3b) : kicker magasin+rayon, pastille fidélité, barre de progression |
| `src/components/shopping/AisleSelector.tsx` | Sélecteur de rayon libre, horizontal scrollable, inter-magasins (2c/3b) |
| `src/hooks/useAisleMode.ts` | État `activeAisleId` + logique « dernier article du rayon coché → rayon suivant » |
| `src/components/shopping/EmptyState.tsx` / `ListSkeleton.tsx` | États vide et squelette de chargement (4k) |
| `src/components/loyalty/LoyaltyCardFullscreen.tsx` | Carte de fidélité plein écran, paysage forcé, wake lock (4h) |
| `src/app/globals.css` (tokens) | Nouvelle palette clair/sombre pilotée par `prefers-color-scheme`, remplace le système `.dark` par classe |
| Assets icône | Icône d'app (variante 6b), favicon 64/32/16, écran de lancement, icône thémée Android 13+ (monochrome) |

#### Fichiers à modifier
| Fichier | Modification |
|---|---|
| `src/app/layout.tsx` | Police Inter (remplace Geist), `theme-color` meta, retrait de tout vestige de dark-mode manuel |
| `src/app/page.tsx` | Écran 2a/3a : bandeau (kicker « En direct », budget live, avatars), groupement magasin > rayon |
| `src/components/shopping/ShoppingList.tsx` | Lignes d'article 58px, anneau de coche, pas-à-pas quantité, tri par `is_purchased`, branchement mode magasin (2c/3b) sur `useAisleMode` |
| `src/components/shopping/HopInput.tsx` | Barre d'ajout persistante + feuille (2e/3c) : suggestions contextualisées, dictée, scan, ligne « Créer dans mon catalogue » |
| `src/components/shopping/ListHeader.tsx` | Fusion dans le nouveau bandeau (2a) + écran 4j : création de liste **sans sélection de magasin** (déduit des produits) |
| `src/components/shopping/ProductForm.tsx` | Écran 4i : prix unitaire dédié, **unité en champ libre** + raccourcis d'unités déjà utilisées, code-barres |
| `src/components/catalog/CatalogSearch.tsx`, `CatalogItemCard.tsx` | Écran 4e : catalogue restylé |
| `src/components/catalog/CatalogImportWizard.tsx` | Écran 4e : assistant 3 pas, mapping colonnes, avertissements |
| `src/components/stores/SortableCategoryItem.tsx` | Écran 2h/3e : réordonnancement des rayons par glissé, style « ligne en cours de déplacement » |
| `src/app/stores/page.tsx`, `src/app/stores/[id]/page.tsx` | Écrans 4d (mes magasins) et 2h/4h (détail magasin : rayons/catalogue/fidélité en onglets segmentés) |
| `src/components/household/InviteMemberModal.tsx` | Écran 4c : bloc code (copier/partager), champ e-mail |
| `src/app/household/setup/page.tsx` | Écran 4b : création de foyer en 2 étapes, tient sans défiler au clavier ouvert |
| `src/components/recipes/*` (`RecipeList`, `RecipeCard`, `RecipeDetail`, `RecipeItemRow`, `AddRecipeItemForm`, `SendToListDialog`) | Écrans 4f (mes recettes), 4g (nouvelle recette), 2i/3f (recette → liste, libellé recalculé selon cases cochées / couverts) |
| `src/components/loyalty/LoyaltyCardList.tsx`, `LoyaltyCardItem.tsx`, `LoyaltyCardDisplay.tsx`, `AddLoyaltyCardForm.tsx`, `AddLoyaltyCardSheet.tsx` | Restylage selon tokens ; `LoyaltyCardDisplay` délègue l'affichage plein écran à `LoyaltyCardFullscreen` |
| `src/app/login/page.tsx` | Écran 4a |

#### Fichiers à supprimer (suppression complète Historique/Statistiques)
| Fichier | Raison |
|---|---|
| `src/app/historique/page.tsx` | Hors périmètre du handoff, retrait explicite |
| `src/app/statistiques/page.tsx` | idem |
| `src/components/statistics/SpendingByCategory.tsx` | idem |
| `src/components/statistics/TopItems.tsx` | idem |
| `src/components/purchases/PurchaseHistoryItem.tsx` | idem |
| `src/components/purchases/PurchaseHistoryList.tsx` | idem |
| `src/components/purchases/ProductPurchaseHistory.tsx` | idem |
| `src/hooks/usePurchaseHistory.ts` | idem |
| `src/hooks/useStatistics.ts` | idem |
| `apps/e2e/cypress/e2e/purchase-history.cy.ts` | Teste une page supprimée |
| `apps/e2e/cypress/e2e/product-purchase-history.cy.ts` | idem |
| `apps/e2e/cypress/e2e/purchase-statistics.cy.ts` | idem |
| `src/components/layout/Sidebar.tsx`, `SidebarContent.tsx`, `UserBadge.tsx` | Remplacés par `TabBar` (navigation desktop sidebar abandonnée au profit du mobile-first) |
| `docs/historique_stats/*.md` | Module documenté mais dont le code front disparaît entièrement |
| Ligne `historique_stats` dans `docs/index.md` | Module retiré du sommaire |

### Fichiers à NE PAS toucher
| Fichier | Raison |
|---|---|
| `apps/api/**` | Aucun changement backend requis |
| `supabase/**` (migrations, RLS) | Schéma inchangé |
| `apps/e2e/cypress/e2e/*` (hors les 3 fichiers listés ci-dessus) | Couvrent des parcours toujours valides, à adapter aux nouveaux sélecteurs seulement si un test casse |

## Interfaces et contrats
Aucune nouvelle API. `activeAisleId` et la logique d'avancement automatique de rayon sont un état **client uniquement** (dérivé de la liste des articles/rayons déjà exposée par l'API existante). Le thème clair/sombre n'a pas d'endpoint ni de colonne associée : purement CSS (`prefers-color-scheme`).

## Critères d'acceptance

### Backend
Sans objet (aucune modification).

### Frontend
- La navigation principale ne comporte plus que 3 onglets (Ma liste / Magasins / Recettes) ; Historique et Statistiques ne sont plus accessibles ni référencés nulle part dans le code.
- Le thème change automatiquement avec `prefers-color-scheme`, sans réglage dans l'app, sans re-render manuel au chargement (pas de flash de mauvais thème).
- Le mode magasin permet de sauter librement à n'importe quel rayon et avance automatiquement au rayon suivant quand le dernier article du rayon courant est coché ; l'écran reste allumé (`wakeLock`) pendant le mode magasin.
- La création/modification de liste ne propose plus de sélection de magasin ; les sections par magasin/rayon sont déduites des produits.
- L'unité d'un article est un champ de saisie libre avec des raccourcis vers les unités déjà utilisées sur ce foyer/catalogue.
- Aucune cible tactile sous 44px ; police Inter (poids 400/500/600 uniquement) ; chiffres comparés en `tabular-nums`.
- `pnpm test`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format` passent sans erreur après implémentation (règle du `CLAUDE.md` d'et-shop).
- La suite e2e restante passe (les 3 specs liées à Historique/Statistiques sont supprimées, pas seulement désactivées).

## Risques de régression
- **Suppression de `Sidebar`/`SidebarContent`** : si un autre écran dépend encore de composants qu'ils exposent (ex. `UserBadge` utilisé ailleurs), vérifier avant suppression.
- **Changement de mécanisme de dark mode** (classe `.dark` → media query pure) : si un composant s'appuyait sur la classe `.dark` pour un comportement JS (pas seulement CSS), il faudra l'adapter.
- **Retrait du champ « magasin » à la création de liste** : toute logique existante qui assume qu'une liste a un `store_id` propre (plutôt que déduit par ses articles) doit être vérifiée côté frontend (le backend n'est pas censé être impacté, à confirmer par l'Engineer lors de l'implémentation).
- **Suppression des tests e2e** Historique/Statistiques : s'assurer qu'aucun autre test ne dépend indirectement de ces pages (ex. navigation de bout en bout qui transiterait par elles).
