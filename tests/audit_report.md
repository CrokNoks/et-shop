# Rapport d'audit QA — Bonnes pratiques Next.js
Date : 2026-03-28

## Résumé

| Critère | Statut |
|---|---|
| AC-01 : layout.tsx sans "use client" | PASS |
| AC-02 : src/app/error.tsx existe avec bouton reset | FAIL |
| AC-03 : src/app/loading.tsx existe avec skeleton | FAIL |
| AC-04 : src/app/stores/loading.tsx existe | FAIL |
| AC-05 : src/app/stores/error.tsx existe | FAIL |
| AC-06 : src/app/loyalty-cards/loading.tsx existe | FAIL |
| AC-07 : src/app/loyalty-cards/error.tsx existe | FAIL |
| AC-08 : globals.css contient --color-brand et --color-accent | FAIL |
| AC-09 : Aucun #1A365D hardcodé dans les .tsx ciblés | FAIL |
| AC-10 : Aucun #FF6B35 hardcodé dans les .tsx ciblés | FAIL |
| AC-11 : src/lib/supabase/client.ts avec singleton | FAIL |
| AC-12 : src/lib/supabase/server.ts existe | FAIL |
| AC-13 : src/lib/env.ts avec validateEnv() | FAIL |
| AC-14 : api.ts utilise getSupabaseBrowserClient() + env.API_URL | FAIL |
| AC-15 : login/page.tsx utilise getSupabaseBrowserClient() | FAIL |
| AC-16 : next.config.ts supprimé | FAIL |
| AC-17 : next.config.mjs sans ignoreBuildErrors: true | FAIL |
| AC-18 : layout.tsx appelle validateEnv() | FAIL |
| AC-19 : useSupabase.ts utilise le singleton | FAIL |

**Score actuel : 1/19 critères satisfaits.**

---

## Détail par critère

### AC-01 — layout.tsx sans "use client" — PASS
`src/app/layout.tsx` est déjà un Server Component pur. Aucune directive `"use client"`.
Il importe `Providers` (déjà un Client Component) et utilise `next/font/google` (compatible SSR).

### AC-02 — src/app/error.tsx — FAIL
Fichier absent. Doit être créé :
- Directive `"use client"` obligatoire (Next.js Error Boundary)
- Props : `error: Error`, `reset: () => void`
- Affiche `error.message` + bouton "Réessayer" qui appelle `reset()`

### AC-03 — src/app/loading.tsx — FAIL
Fichier absent. Doit être créé :
- Server Component (pas de `"use client"`)
- Affiche un skeleton (ex: divs avec `animate-pulse`)

### AC-04 — src/app/stores/loading.tsx — FAIL
Fichier absent. Même pattern que AC-03 pour la route `/stores`.

### AC-05 — src/app/stores/error.tsx — FAIL
Fichier absent. Même pattern que AC-02 pour la route `/stores`.

### AC-06 — src/app/loyalty-cards/loading.tsx — FAIL
Fichier absent. Même pattern que AC-03 pour la route `/loyalty-cards`.

### AC-07 — src/app/loyalty-cards/error.tsx — FAIL
Fichier absent. Même pattern que AC-02 pour la route `/loyalty-cards`.

### AC-08 — globals.css variables CSS — FAIL
`src/app/globals.css` ne contient ni `--color-brand` ni `--color-accent`.
Doit ajouter dans `:root` :
```css
--color-brand: #1A365D;
--color-accent: #FF6B35;
```

### AC-09 — Couleur #1A365D hardcodée — FAIL
La couleur `#1A365D` est présente en dur dans les fichiers suivants :
- `src/components/shopping/ShoppingList.tsx` (de nombreuses occurrences : classes Tailwind `text-[#1A365D]`, `bg-[#1A365D]`)
- `src/components/layout/Sidebar.tsx` (`bg-[#1A365D]`, `text-[#1A365D]`)
- `src/components/layout/SidebarContent.tsx` (`text-[#1A365D]`, `border-[#1A365D]`, `bg-[#1A365D]`)
- `src/app/login/page.tsx` (`text-[#1A365D]`)

Toutes doivent être remplacées par `var(--color-brand)`.

### AC-10 — Couleur #FF6B35 hardcodée — FAIL
La couleur `#FF6B35` est présente en dur dans :
- `src/components/shopping/ShoppingList.tsx` (nombreuses occurrences)
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/SidebarContent.tsx`
- `src/app/login/page.tsx`

Toutes doivent être remplacées par `var(--color-accent)`.

### AC-11 — src/lib/supabase/client.ts singleton — FAIL
Fichier absent. Doit être créé avec le pattern singleton :
```ts
import { createBrowserClient } from "@supabase/ssr"
import { env } from "@/lib/env"

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  }
  return client
}
```

### AC-12 — src/lib/supabase/server.ts — FAIL
Fichier absent. Doit être créé pour les Server Components.

### AC-13 — src/lib/env.ts — FAIL
Fichier absent. Doit être créé avec `validateEnv()` qui lève une erreur si
`NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont manquantes.

### AC-14 — api.ts utilise le singleton — FAIL
`src/lib/api.ts` crée encore un `createBrowserClient` inline à chaque appel de `fetchApi`.
Doit utiliser `getSupabaseBrowserClient()` et `env.API_URL` depuis `@/lib/env`.

### AC-15 — login/page.tsx utilise le singleton — FAIL
`src/app/login/page.tsx` instancie `createBrowserClient(...)` directement.
Doit importer et appeler `getSupabaseBrowserClient()`.

### AC-16 — next.config.ts supprimé — FAIL
`apps/web/next.config.ts` existe encore (doublon vide).
Ce fichier doit être supprimé car `next.config.mjs` est la config de référence.

### AC-17 — next.config.mjs sans ignoreBuildErrors: true — FAIL
`next.config.mjs` contient `typescript: { ignoreBuildErrors: true }`.
Cette option masque les erreurs TypeScript au build. Doit être supprimée ou mise à `false`.
**Attention** : avant de supprimer ce flag, s'assurer qu'il n'y a pas d'erreurs TS bloquantes.

### AC-18 — layout.tsx appelle validateEnv() — FAIL
`src/app/layout.tsx` n'importe pas `validateEnv` et ne l'appelle pas.
Doit ajouter en haut du module :
```ts
import { validateEnv } from "@/lib/env"
validateEnv()
```

### AC-19 — useSupabase.ts utilise le singleton — FAIL
`src/hooks/useSupabase.ts` crée encore un `createBrowserClient` via `useMemo`.
Doit être simplifié pour appeler `getSupabaseBrowserClient()`.

---

## Risques identifiés

### Risque TypeScript (critique avant AC-17)
Avant de supprimer `ignoreBuildErrors: true`, l'engineer doit vérifier qu'il n'y a pas
d'erreurs TS dans le codebase. Le fichier `src/components/shopping/ShoppingList.tsx`
contient un accès à `item.barcode` (ligne 163) et `item.price` (ligne 160) — ces propriétés
doivent être définies dans l'interface `ShoppingListItem` (à vérifier dans `src/types`).

### Risque Singleton côté SSR
Le singleton Supabase browser-only dans `client.ts` ne doit JAMAIS être utilisé dans
des Server Components. `server.ts` doit utiliser une approche différente (ex: `createServerClient`
avec les cookies de la requête). Le scope est limité aux composants client.

### Risque cookieOptions
Les fichiers actuels (`api.ts`, `login/page.tsx`, `useSupabase.ts`) passent
`cookieOptions: { name: "__session" }` lors de l'initialisation du client.
Le singleton doit conserver cette option ou vérifier qu'elle n'est plus nécessaire.

---

## Actions Engineer requises (par ordre de priorité)

1. Créer `src/lib/env.ts` (bloquant pour tout le reste)
2. Créer `src/lib/supabase/client.ts` (singleton)
3. Créer `src/lib/supabase/server.ts`
4. Modifier `src/lib/api.ts` pour utiliser le singleton et `env`
5. Modifier `src/hooks/useSupabase.ts` pour utiliser le singleton
6. Modifier `src/app/login/page.tsx` pour utiliser le singleton
7. Modifier `src/app/layout.tsx` pour appeler `validateEnv()`
8. Modifier `src/app/globals.css` pour ajouter `--color-brand` et `--color-accent`
9. Remplacer les couleurs hardcodées dans ShoppingList.tsx, Sidebar.tsx, SidebarContent.tsx, login/page.tsx
10. Créer `src/app/error.tsx`, `src/app/loading.tsx` et leurs déclinaisons par route
11. Supprimer `next.config.ts`
12. Mettre à jour `next.config.mjs` (supprimer `ignoreBuildErrors: true`)
