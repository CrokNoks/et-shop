# Fonctionnalités — Foyers & Authentification

## Vue d'ensemble

Un foyer (_household_) est l'unité d'isolation de toutes les données de l'application. Chaque utilisateur appartient à un ou plusieurs foyers. L'authentification passe par Supabase Auth (email/mot de passe). Toutes les données (listes, catalogue, recettes, magasins) sont isolées par foyer via RLS.

---

## Authentification

La connexion se fait par email et mot de passe via Supabase Auth. Après connexion réussie :
- Si l'utilisateur a des foyers → le premier foyer est sélectionné automatiquement et son ID est stocké dans `localStorage`
- Si l'utilisateur n'a pas de foyer → redirection vers `/household/setup`

La session est gérée par Supabase (tokens JWT). Le middleware Next.js (`src/middleware.ts`) protège les routes authentifiées et rafraîchit la session automatiquement.

## Créer un foyer

Sur `/household/setup`, l'utilisateur crée son premier foyer en lui donnant un nom. Deux triggers SQL s'exécutent automatiquement :
- `handle_new_household` : définit `owner_id = auth.uid()` sur le foyer
- `handle_new_household_membership` : ajoute le créateur comme membre avec le rôle `admin`

## Lister ses foyers

`GET /households/me` retourne tous les foyers dont l'utilisateur est membre, avec leurs membres.

## Inviter un membre

Un admin peut inviter un autre utilisateur par son email. L'utilisateur invité **doit déjà être inscrit** sur Et-Shop — il n'y a pas de système d'invitation par email avec lien. Le membre est ajouté avec le rôle `member`.

## Retirer un membre

Un admin peut retirer un membre. L'admin peut-il se retirer lui-même ? Oui — il n'y a pas de validation empêchant la suppression du dernier admin.

## Foyer actif (sélection)

L'ID du foyer actif est stocké dans `localStorage` (`active_household_id`) côté frontend et transmis dans le header `x-household-id` sur chaque requête API. La page principale redirige vers `/household/setup` si ce header est absent ou invalide.

---

## Ce qui n'est pas inclus

- Invitation par lien email
- Changement de rôle d'un membre existant (admin ↔ member)
- Renommer un foyer
- Quitter un foyer (via l'UI — l'API supporte `DELETE /households/:id/members/:userId`)
- Suppression d'un foyer
