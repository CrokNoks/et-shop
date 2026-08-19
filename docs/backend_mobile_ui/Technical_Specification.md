# Change Request — Adaptation backend pour la refonte mobile

## Contexte
La refonte mobile du front (`refonte_mobile_ui`, branche `feature/refonte_mobile_ui`) a été implémentée, revue et corrigée sans aucun changement backend — c'était une contrainte explicite de ce cycle. Au fil de son implémentation, `docs/refonte_mobile_ui/decisions.md` a documenté précisément les endroits où le design ne peut pas être pleinement réalisé sans adapter l'API (NestJS 11, pattern service pour `shopping-lists`/`households`/`recipes`/`stores`, Clean Architecture pour `loyalty-cards`/`purchases`, Supabase Postgres + RLS).

Ce Change Request lève ces limitations une par une. Chaque point liste le changement backend et, quand une donnée nouvellement exposée n'est consommée nulle part, le point d'intégration frontend minimal pour qu'elle serve à quelque chose.

## Stack détecté
- Backend : NestJS 11, Supabase (Postgres + RLS + Realtime), pattern service pour les modules concernés (pas de Clean Architecture à introduire ici, sauf pour `purchases` qui l'utilise déjà)
- Frontend : Next.js 16 / React 19 (intégration minimale seulement, cf. chaque point)
- Migrations : `supabase/migrations/*.sql`, numérotées chronologiquement

## Périmètre des modifications

### 1. Auteur de la coche (« coché par {auteur} »)

**Backend**
- Migration : `ALTER TABLE shopping_list_items ADD COLUMN purchased_by UUID REFERENCES profiles(id) ON DELETE SET NULL;` (`purchased_at` existe déjà via `updated_at`, pas besoin d'une colonne dédiée).
- `supabase/migrations/20260330000002_rpc_record_purchase_atomic.sql` (fonction RPC) : renseigner `purchased_by = auth.uid()` en plus de `is_purchased = true`. Une nouvelle migration ajoute une fonction `record_purchase_atomic` remplacée (`CREATE OR REPLACE FUNCTION`), ne pas éditer le fichier de migration existant.
- `supabase/migrations/20260330000003_rpc_cancel_purchase_atomic.sql` (RPC) : remettre `purchased_by = NULL` symétriquement, même principe (nouvelle migration, fonction remplacée).
- `apps/api/src/shopping-lists/shopping-lists.service.ts` : la requête de lecture des items doit exposer `purchased_by` et, si possible, le nom du profil associé (`profiles(full_name)`) — dépend du point 2 pour être utile au-delà de l'utilisateur courant.

**Frontend (intégration minimale)**
- `apps/web/src/components/shopping/ShoppingList.tsx` : afficher « coché par {nom} · il y a {ancienneté} » (actuellement seulement l'ancienneté) quand `purchased_by` est présent et différent de l'utilisateur courant.

### 2. Lecture du profil des autres membres du foyer (RLS)

**Backend**
- Nouvelle policy RLS sur `public.profiles` : un utilisateur peut lire le profil d'un autre utilisateur s'ils partagent un `household_id` commun (jointure sur `list_members`/`household_members` — vérifier la table exacte utilisée par `households.service.ts`). Garder la policy existante (`auth.uid() = id`) en plus, ne pas la remplacer.
- Vérifier que `GET /households/:id/members` embed déjà `profiles(*)` (c'est le cas) — aucun changement de endpoint nécessaire, seule la policy RLS bloquait le contenu.

**Frontend (intégration minimale)**
- Aucune : `MemberAvatars.tsx` et l'affichage « coché par » (point 1) consomment déjà `profile?.full_name`/`profile?.email` avec repli sur `?`/rien — ils s'amélioreront automatiquement une fois la policy en place, sans changement de code.

### 3. Invitation par code

**Backend**
- Nouvelle table `household_invites` (`id`, `household_id`, `code` (court, lisible, ex. 8 caractères alphanumériques), `created_at`, `expires_at` (`created_at + interval '48 hours'`), `used_at NULL`, `created_by`).
- `POST /households/:id/invite-code` (`households.controller.ts`/`households.service.ts`) : génère un code, l'enregistre, le retourne. Un seul code actif à la fois par foyer (invalide l'ancien si non expiré/non utilisé plutôt que d'en cumuler).
- `POST /households/join` : body `{ code: string }`, vérifie validité (non expiré, non utilisé), ajoute l'utilisateur courant comme membre du foyer correspondant (réutilise la logique déjà présente dans `POST /households/:id/members`, sans email), marque le code `used_at = now()`.

**Frontend (intégration minimale)**
- `apps/web/src/components/household/InviteMemberModal.tsx` : afficher le bloc code monospace + « valable 48h · usage unique » + boutons Copier/Partager déjà prévus par le design (écran 4c) mais non implémentés faute d'endpoint — appelle `POST /households/:id/invite-code` à l'ouverture de la feuille.
- Un écran/flux de saisie du code à la connexion ou à l'inscription doit exister pour consommer `POST /households/join` — à cadrer précisément si retenu (cf. Critères d'acceptance).

### 4. Recettes : couverts (servings) et coût estimé

**Backend**
- Migration : `ALTER TABLE recipes ADD COLUMN servings INTEGER DEFAULT 4;`
- `apps/api/src/recipes/dto/create-recipe.dto.ts` / `update-recipe.dto.ts` : ajouter `servings?: number` (`@IsOptional() @IsInt() @Min(1)`).
- Coût estimé : `recipe_items`/`items_catalog` n'ont pas de prix de référence. Migration : `ALTER TABLE items_catalog ADD COLUMN reference_price DECIMAL;`, mis à jour opportunistement (dernier prix connu) à chaque achat réussi (`RecordPurchaseUseCase` : après insertion du `PurchaseRecord`, `UPDATE items_catalog SET reference_price = :price WHERE id = :catalogItemId` si l'item est lié à un catalogue). `GET /recipes/:id` calcule et renvoie un `estimated_cost` = somme des `reference_price × quantity` des ingrédients (null/absent si un ingrédient n'a pas encore de prix connu — ne pas afficher un total partiel trompeur).

**Frontend (intégration minimale)**
- `apps/web/src/app/recipes/new/page.tsx` : champ pas-à-pas « Couverts » (déjà décrit par le design, non implémenté faute de champ).
- `apps/web/src/components/recipes/RecipeDetail.tsx` : afficher `estimated_cost` s'il est présent.

### 5. Envoi partiel d'ingrédients vers une liste

**Backend**
- `apps/api/src/recipes/dto/send-to-list.dto.ts` : ajouter `item_ids?: string[]` (`@IsOptional() @IsArray() @IsUUID('4', { each: true })`).
- `apps/api/src/recipes/recipes.service.ts` (méthode d'envoi vers une liste) : si `item_ids` est fourni, ne traiter que ces ingrédients ; sinon comportement actuel (tous).

**Frontend (intégration minimale)**
- `apps/web/src/components/recipes/RecipeItemRow.tsx` / `RecipeDetail.tsx` : cases à cocher par ingrédient (déjà décrites par le design, écran 2i/3f), bouton d'action recalculé « Ajouter N articles · {coût} » selon la sélection et `servings`.
- `apps/web/src/components/recipes/SendToListDialog.tsx` : transmettre `item_ids` sélectionnés.

### 6. Création de produit catalogue sans magasin obligatoire — ⚠️ point à trancher

**Constat** : `items_catalog.store_id` est **`NOT NULL`** avec une contrainte unique `(name, store_id)`, posée par la migration `20260324000003_store_centric_model.sql`. Le pattern « Créer « x » dans mon catalogue » (déjà en place dans `HopInput.tsx` pour la liste de courses) suppose un magasin connu au moment de la saisie ; l'écran 4g (nouvelle recette) n'a pas ce contexte, d'où son absence documentée dans `decisions.md`.

Rendre `store_id` optionnel demande :
- `ALTER TABLE items_catalog ALTER COLUMN store_id DROP NOT NULL;`
- Remplacer l'index unique `(name, store_id)` par un index partiel qui tolère plusieurs lignes `store_id IS NULL` du même nom (`CREATE UNIQUE INDEX ... ON items_catalog (name, store_id) WHERE store_id IS NOT NULL;` + un second index pour le cas `store_id IS NULL` si l'unicité doit aussi s'y appliquer).
- Revoir toute requête qui suppose `store_id` non nul (jointures `stores(name)`, RLS `items_catalog` basée sur `store_id` — la policy actuelle vérifie l'appartenance via le magasin, un item sans magasin n'a plus ce chemin d'accès RLS et doit en obtenir un autre, ex. basé sur le foyer qui a créé l'item).

C'est un changement de schéma avec un vrai risque de régression sur le regroupement des listes par magasin (le frontend sait déjà grouper « articles sans magasin à la fin » selon le design, mais ce n'est pas implémenté aujourd'hui puisqu'aucun item sans magasin n'existe en pratique).

**Recommandation** : traiter ce point comme une décision séparée plutôt que de l'implémenter par défaut dans ce cycle — cf. question ouverte dans la section Critères d'acceptance.

### Fichiers à NE PAS toucher
| Fichier | Raison |
|---|---|
| `apps/web/src/**` (hors les points d'intégration minimale listés ci-dessus) | Le front de la refonte mobile est terminé et revu ; pas de restylage à refaire |
| `apps/api/src/loyalty-cards/**` | Non concerné par les limitations documentées |

## Interfaces et contrats
- Nouveau : `POST /households/:id/invite-code`, `POST /households/join`.
- Modifiés : `SendToListDto` (`item_ids?`), `CreateRecipeDto`/`UpdateRecipeDto` (`servings?`), réponse `GET /shopping-lists` (items exposent `purchased_by`), réponse `GET /recipes/:id` (`servings`, `estimated_cost`).
- Nouvelles tables/colonnes : `household_invites`, `shopping_list_items.purchased_by`, `recipes.servings`, `items_catalog.reference_price`.

## Critères d'acceptance

### Backend
- Cocher un article renseigne `purchased_by` ; le décocher le remet à `NULL`.
- Un membre du foyer peut lire `full_name`/`email` des autres membres via `GET /households/:id/members` (vérifié par un test qui se connecte avec un 2ᵉ utilisateur du même foyer).
- Un code d'invitation généré est valide 48h, usage unique, et rejeté après expiration ou après utilisation.
- `servings` et `estimated_cost` sont exposés par `GET /recipes/:id` ; `estimated_cost` est absent (pas `0`) si un ingrédient n'a pas de prix connu.
- `POST /recipes/:id/send-to-list` avec `item_ids` n'ajoute que les ingrédients listés ; sans `item_ids`, tous (non-régression).

### Frontend
- « coché par {nom} » s'affiche pour les coches faites par un autre membre du foyer.
- Les avatars des membres du foyer affichent initiales/nom réels plutôt que « ? ».
- Le bloc code d'invitation de l'écran 4c fonctionne (génération, copier, partager).
- Le champ « Couverts » et le coût estimé apparaissent en création/détail de recette.
- Des cases à cocher permettent de sélectionner un sous-ensemble d'ingrédients à l'envoi vers une liste, avec libellé de bouton recalculé.

## Question ouverte avant de lancer le développement
**Le point 6 (produit catalogue sans magasin) est-il inclus dans ce cycle ?** Il touche une contrainte NOT NULL + un index unique posés intentionnellement par une migration antérieure, avec un risque de régression sur le regroupement par magasin. Options :
- **A. Reporté** — ce cycle couvre les points 1 à 5 uniquement ; le pattern « Créer un produit » reste absent de l'écran 4g des recettes (déjà le cas aujourd'hui, pas une régression).
- **B. Inclus** — le cycle couvre aussi le point 6, avec la migration de schéma décrite et une vérification approfondie de tout le code dépendant de `store_id` non-null.

## Risques de régression
- RPC `record_purchase_atomic`/`cancel_purchase_atomic` : toute nouvelle version de la fonction doit rester atomique (transaction unique) comme l'actuelle — ne pas scinder en plusieurs requêtes séparées.
- Policy RLS `profiles` élargie : bien scoper à « même foyer », jamais à tous les profils (fuite de données sinon).
- `items_catalog.reference_price` mis à jour à chaque achat : vérifier que ça ne ralentit pas le chemin critique de `RecordPurchaseUseCase` (une requête `UPDATE` de plus par coche).
- Point 6 si retenu (option B) : RLS `items_catalog` et tout regroupement par magasin côté frontend qui suppose `store_id` toujours présent.
