# Spécifications techniques — Bonnes pratiques Next.js

## Stack

- Langage : TypeScript 5
- Framework : Next.js 16.2.1 (App Router)
- Gestionnaire de dépendances : pnpm
- Scope : `apps/web/` uniquement

---

## Fichiers créés

| Fichier | Rôle |
|---|---|
| `src/app/error.tsx` | Error boundary global (Client Component) |
| `src/app/loading.tsx` | Loading skeleton global (Server Component) |
| `src/app/stores/error.tsx` | Error boundary route `/stores` |
| `src/app/stores/loading.tsx` | Loading UI route `/stores` |
| `src/app/loyalty-cards/error.tsx` | Error boundary route `/loyalty-cards` |
| `src/app/loyalty-cards/loading.tsx` | Loading UI route `/loyalty-cards` |
| `src/lib/env.ts` | Validation des variables d'environnement |
| `src/lib/supabase/client.ts` | Singleton browser Supabase |
| `src/lib/supabase/server.ts` | Client serveur Supabase (Server Components) |

---

## Détail des composants structurels

### `src/lib/env.ts`

```ts
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const

export function validateEnv() {
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Variable d'environnement manquante : ${key}`)
  }
}

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
}
```

Appelé depuis `layout.tsx` (Server Component) — l'erreur est levée au démarrage serveur, pas à l'exécution d'une requête.

### `src/lib/supabase/client.ts`

Pattern singleton : une seule instance du browser client est créée et réutilisée. Utilise `createBrowserClient` de `@supabase/ssr`. Dépend de `env` pour les variables d'environnement.

### `src/app/layout.tsx`

Server Component (pas de `"use client"`). `validateEnv()` est appelé directement. Les providers client sont délégués à `providers.tsx`.

---

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/app/layout.tsx` | Retiré `"use client"` → Server Component |
| `src/app/globals.css` | Ajout de `--color-brand` et `--color-accent` dans `:root` |
| `src/components/shopping/ShoppingList.tsx` | Couleurs hex → `var(--color-brand)` / `var(--color-accent)` |
| `src/components/layout/Sidebar.tsx` | Idem |
| `src/components/layout/SidebarContent.tsx` | Idem |
| `src/hooks/useSupabase.ts` | Utilise `getSupabaseBrowserClient()` |
| `src/lib/api.ts` | Utilise singleton Supabase + `env.API_URL` |
| `src/app/login/page.tsx` | Utilise `getSupabaseBrowserClient()` |
| `next.config.mjs` | Retiré `typescript.ignoreBuildErrors: true` |

### Fichier supprimé

- `next.config.ts` — doublon de `next.config.mjs`

---

## Configuration

Variables d'environnement requises (validées au démarrage) :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de l'instance Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `NEXT_PUBLIC_API_URL` | URL de l'API NestJS (défaut : `http://localhost:3001`) |
