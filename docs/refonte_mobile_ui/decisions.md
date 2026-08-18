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
