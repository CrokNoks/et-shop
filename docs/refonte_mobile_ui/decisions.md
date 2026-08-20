# Décisions techniques — Refonte mobile UI

## Thème clair/sombre : media query pure, pas de classe

Le CSS actuel définit `.dark` comme variante Tailwind (`@custom-variant dark (&:is(.dark *))`) mais rien ne pose jamais cette classe (pas de `next-themes`, pas de toggle) : le dark mode est du code mort. Le design impose un pilotage **uniquement** par `prefers-color-scheme`, sans réglage persisté.
**Décision** : basculer sur `@media (prefers-color-scheme: dark)` directement (ou garder la syntaxe `.dark` de Tailwind mais la faire correspondre à la media query côté CSS, sans JS). Aucun état à persister, aucun composant de toggle à créer.

## Police : Geist → Inter

Le design spécifie Inter avec poids 400/500/600 uniquement (`plus de font-black`). Le layout actuel charge `Geist`/`Geist_Mono` via `next/font/google`.
**Décision** : remplacer par `Inter` via `next/font/google`, retirer les poids > 600 s'ils sont utilisés quelque part.

## Navigation : Sidebar desktop → TabBar mobile

`Sidebar.tsx` / `SidebarContent.tsx` sont pensés desktop (menu latéral). Le design est mobile-first avec une tab bar basse à 3 entrées.
**Décision** : `Sidebar`/`SidebarContent`/`UserBadge` sont supprimés, remplacés par `TabBar.tsx`. Si `UserBadge` est utilisé ailleurs (ex. écran foyer), le réintégrer directement dans l'écran concerné plutôt que de le garder comme composant de sidebar.

## Historique / Statistiques : suppression complète, pas un simple retrait de nav

Décision explicite de l'utilisateur (pas seulement hors périmètre du handoff) : le code front correspondant est supprimé, pas laissé en dead code derrière un flag.
**Décision** : suppression des pages, composants, hooks et tests e2e listés dans le Change Request. Le backend n'est pas touché (les données d'historique/statistiques restent en base, seule l'UI disparaît) — si l'utilisateur veut aussi retirer les endpoints backend correspondants, ce sera une feature séparée.

## Mode magasin : `activeAisleId` en état client uniquement

Le passage automatique au rayon suivant et la sélection libre de rayon ne nécessitent aucune nouvelle donnée serveur : la liste des rayons/articles est déjà disponible via l'API existante. `activeAisleId` est un état local (probablement dans `ShoppingList.tsx` ou un hook dédié `useAisleMode`), non persisté côté serveur.

## Unité d'article : déjà libre côté backend

`unit` est un `string` libre en base (`apps/api/shopping-lists.service.ts`). Le passage à un champ de saisie libre côté UI (écran 4i) ne demande aucune migration ni changement de contrat API — uniquement un changement de composant frontend (`ProductForm.tsx`).

## Création de liste sans sélection de magasin

Le design retire le choix de magasin à la création d'une liste : les sections magasin/rayon sont déduites des produits ajoutés (chaque produit du catalogue porte déjà son magasin/rayon). À vérifier par l'Engineer : si le frontend actuel envoie un `store_id` explicite à la création de liste, ce champ devient optionnel/inutilisé côté UI ; aucune contrainte backend ne semble l'exiger d'après l'exploration initiale, mais la Change Request signale ce point comme risque de régression à confirmer en implémentation.

## Limitations connues (backend)

Deux détails du design (écrans 2a/2c) ne sont pas pleinement réalisables sans toucher au backend. Documentés ici pour ne pas les redécouvrir plus tard — **aucun changement backend n'est fait dans cette refonte**, ces points restent ouverts pour une feature séparée si on veut les traiter.

- **« coché par {auteur} · il y a {ancienneté} »** : `shopping_list_items` n'a pas de colonne `purchased_by` (seulement `added_by`, qui trace l'ajout, pas l'achat). Impossible d'afficher l'auteur de la coche sans ajouter cette colonne + la faire renseigner par l'endpoint `purchase`. L'UI affiche seulement l'ancienneté (« il y a X min », via `updated_at`, déjà exposé) sans nom.
- **Avatars des membres du foyer** : la policy RLS sur `public.profiles` n'autorise que `auth.uid() = id` en lecture (`supabase/migrations/20260321000000_initial_schema.sql`). `GET /households/:id/members` (qui fait un embed `profile:profiles(*)`) ne peut donc renvoyer le nom/avatar que du membre courant — les autres membres reviennent avec un `profile` à `null`. C'est déjà le cas aujourd'hui dans `InviteMemberModal` (repli sur l'email, silencieusement `undefined` pour les autres) ; la refonte ne fait qu'exposer ce manque dans un nouvel endroit (`MemberAvatars`, repli sur `?`). Pour un vrai affichage multi-membres, il faudrait une policy RLS supplémentaire du type « un membre du foyer peut lire le profil des autres membres du même foyer ».
- **Code d'invitation (écran 4c)** : pas d'endpoint de génération de code côté API, seulement l'ajout direct d'un membre par email (`POST /households/:id/members`). Le bloc "code monospace · valable 48h · usage unique" du design n'est pas implémenté.
- **Recettes — couverts et coût estimé (écrans 2i/3f, 4g)** : `Recipe` n'a pas de champ "couverts"/servings, ni `RecipeItem`/`CatalogItem` de champ prix (seul `ShoppingListItem` en a un). Pas de pas-à-pas "Couverts" ni de "≈ coût estimé" affiché.
- **Recettes — envoi partiel vers une liste (écran 2i/3f)** : `SendToListDto` envoie systématiquement tous les ingrédients de la recette, aucun paramètre pour n'en sélectionner qu'une partie. Pas de cases à cocher ni de libellé "Ajouter N articles · {coût}" recalculé — les afficher sans effet réel aurait été trompeur.
- **Recettes — création de produit à la volée (écran 4g)** : créer un `CatalogItem` exige un `store_id` ; le pattern "Créer « x » dans mon catalogue" posé dans `HopInput` (Cycle C) n'a pas été répliqué dans `AddRecipeItemForm` pour cette raison.
- **Recettes — puces d'ingrédients sur la liste (écran 4f)** : `GET /recipes` renvoie `recipe_items` en agrégat (`recipe_items(count)`), pas le détail des items — `RecipeCard.tsx` ne peut donc afficher qu'un compte d'ingrédients, pas leurs noms (qui n'existent que via `GET /recipes/:id`). Les puces de noms du design ne sont pas affichées sur cette liste ; les afficher aurait nécessité soit un fetch par recette (N+1), soit un changement d'endpoint, tous deux hors périmètre de cette refonte.

## Cibles tactiles sous 44px assumées

Le README du handoff dit en toutes lettres (section "Fidelity") que les cibles tactiles citées explicitement pour un écran sont **définitives**, à recréer au pixel — en tension avec la règle générale "Aucune cible tactile sous 44px" listée dans "Design Tokens > Hauteurs". Le spécifique l'emporte sur le général pour les éléments suivants, volontairement laissés sous 44px :

- Anneau de coche 26px (écran 2a — "Anneau de coche 26px").
- Raccourcis d'unité 28px (écran 4i — "(28px, radius 8px...)").
- Pastilles du sélecteur de rayon 32px (écran 2c/3b — "Pastilles 32px").
- Pastille "Fidélité" en mode magasin 34px (écran 2c/3b).

Les cas où une taille codée divergeait de la valeur explicite du design (ex. pas-à-pas de quantité à ~20px au lieu des 26px prescrits, boutons micro/scan de `HopInput` à 38px au lieu de 40px) ont été corrigés pour correspondre au design, pas à la règle générale des 44px.

## Écran 4h : `LoyaltyCardFullscreen` non créé

La spec initiale prévoyait un nouveau composant `LoyaltyCardFullscreen.tsx`. En creusant au Cycle G, `LoyaltyCardOverlay.tsx` (déjà existant, monté depuis `ShoppingList.tsx` et `StoreLoyaltyCards.tsx`) faisait déjà tout ce que demande l'écran 4h : plein écran, wake lock, `screen.orientation.lock("landscape")`, repli CSS pivoté à 90° si l'API échoue, code-barres, "Présentez ce code à la caisse". Il a été restylé sur les tokens `--es-*` plutôt que dupliqué dans un nouveau composant — choix délibéré pour éviter deux implémentations divergentes du même écran.

## Icône Android 13+ monochrome (écran 7c)

Correction : la conclusion initiale (« spécificité de l'adaptive icon Android natif packagé, non implémentable dans une PWA web ») était erronée. Le Web App Manifest standard supporte `purpose: "monochrome"` — Chrome/Android recolore lui-même l'icône avec la couleur d'accent système si l'utilisateur active les « icônes thématisées » du launcher, sans empaquetage natif. Implémenté : `AppIconMonochrome` (`lib/app-icon.tsx`) sert une variante fond transparent, une seule couleur pleine, où la coche est un vide réservé (fill-rule evenodd) dans le panier, exposée via `app/pwa-icon-monochrome/route.tsx` et déclarée dans `manifest.ts`.

## Duplications factorisées

Trois petites duplications signalées en revue ont été factorisées (Fix Cycle K5) :
- `ACTIVE_LIST_KEY` centralisée dans `lib/constants.ts`, importée par `app/page.tsx` et `app/lists/page.tsx`.
- `handleLogout` (signOut Supabase + nettoyage localStorage + redirection `/login`) extrait en hook partagé `hooks/useLogout.ts`, utilisé par `ListHeader.tsx` et `app/lists/page.tsx`.
- Le SVG de l'icône d'app (variante 6b) factorisé dans `lib/app-icon.tsx` (composant `AppIconMark`), importé par `icon.tsx`, `apple-icon.tsx`, `pwa-icon-192/route.tsx` et `pwa-icon-512/route.tsx` — rendu inchangé, seuls la taille et le radius du carré varient par appel.
