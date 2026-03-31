# Fonctionnalités — Bonnes pratiques Next.js

## Vue d'ensemble

Refactoring du frontend Next.js 16 pour exploiter correctement l'App Router. Aucune fonctionnalité visible par l'utilisateur n'a été ajoutée — les changements améliorent la robustesse, la maintenabilité et les performances de démarrage.

---

## Server Component pour le layout racine

`src/app/layout.tsx` ne contient plus `"use client"`. Il est un Server Component pur. Les providers React Query restent dans `providers.tsx` (Client Component déjà isolé). Cela permet à Next.js d'optimiser le rendu initial.

## Validation des variables d'environnement au démarrage

`src/lib/env.ts` valide la présence de `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` au démarrage serveur (appelé depuis `layout.tsx`). Si une variable est manquante, l'app lève une erreur explicite plutôt que d'échouer silencieusement plus tard.

## Singleton Supabase browser

`src/lib/supabase/client.ts` expose `getSupabaseBrowserClient()` — une instance unique du client Supabase côté browser. Évite la création d'une nouvelle instance à chaque appel de hook. Un client serveur est disponible dans `src/lib/supabase/server.ts` pour les Server Components.

## Error boundaries et loading UI

Chaque route principale dispose désormais de :
- `error.tsx` — Client Component affiché en cas d'erreur non rattrapée, avec bouton "Réessayer"
- `loading.tsx` — Server Component skeleton affiché pendant le chargement Suspense

Routes couvertes : `/` (global), `/stores`, `/loyalty-cards`.

## Variables CSS de marque

Les couleurs `#1A365D` (brand) et `#FF6B35` (accent) sont centralisées en variables CSS dans `globals.css` :
- `--color-brand: #1A365D`
- `--color-accent: #FF6B35`

Les composants `ShoppingList`, `Sidebar` et `SidebarContent` utilisent désormais `var(--color-brand)` et `var(--color-accent)`.

## Configuration Next.js unifiée

`next.config.ts` (doublon) a été supprimé. `next.config.mjs` est le seul fichier de configuration. `typescript.ignoreBuildErrors` a été retiré — les erreurs TypeScript bloquent le build.

---

## Ce qui n'est pas inclus

- Conversion des pages applicatives en Server Components (trop couplées au real-time et aux hooks)
- Streaming Suspense sur les routes de données
- Mise en cache côté serveur des appels API
